# Multi-stage Docker build for NAMASTE-SYNC application
# Stage 1: Build environment
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production environment with MongoDB
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install MongoDB and system dependencies
RUN apk add --no-cache \
    mongodb \
    mongodb-tools \
    nginx \
    supervisor \
    python3 \
    make \
    g++

# Create necessary directories
RUN mkdir -p /data/db /var/log/mongodb /var/log/supervisor /etc/supervisor/conf.d

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Copy configuration files
COPY --from=build /app/vite.config.ts ./
COPY --from=build /app/tailwind.config.ts ./
COPY --from=build /app/tsconfig*.json ./
COPY --from=build /app/.env ./

# Create nginx configuration for remote access
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /app/dist; \
    index index.html; \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header Referrer-Policy "no-referrer-when-downgrade" always; \
    add_header Content-Security-Policy "default-src '"'"'self'"'"' http: https: data: blob: '"'"'unsafe-inline'"'"'" always; \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json; \
    \
    # Main application \
    location / { \
        try_files $uri $uri/ /index.html; \
        expires 1h; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Static assets with longer cache \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # API proxy \
    location /api/ { \
        proxy_pass http://localhost:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_cache_bypass $http_upgrade; \
        proxy_read_timeout 86400; \
    } \
    \
    # Health check endpoint \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/http.d/default.conf

# Create supervisor configuration
RUN echo '[supervisord] \
nodaemon=true \
logfile=/var/log/supervisor/supervisord.log \
pidfile=/var/run/supervisord.pid \
\
[program:mongodb] \
command=mongod --dbpath /data/db --logpath /var/log/mongodb/mongod.log --fork \
autostart=true \
autorestart=true \
stderr_logfile=/var/log/supervisor/mongodb.err.log \
stdout_logfile=/var/log/supervisor/mongodb.out.log \
\
[program:nginx] \
command=nginx -g "daemon off;" \
autostart=true \
autorestart=true \
stderr_logfile=/var/log/supervisor/nginx.err.log \
stdout_logfile=/var/log/supervisor/nginx.out.log \
\
[program:app-preview] \
command=npm run preview -- --host 0.0.0.0 --port 3000 \
directory=/app \
autostart=true \
autorestart=true \
stderr_logfile=/var/log/supervisor/app.err.log \
stdout_logfile=/var/log/supervisor/app.out.log' > /etc/supervisor/conf.d/supervisord.conf

# Create MongoDB initialization script
RUN echo '#!/bin/sh \
echo "Initializing MongoDB..." \
mongod --dbpath /data/db --logpath /var/log/mongodb/mongod.log --fork \
sleep 5 \
mongo namaste-sync --eval "db.createCollection(\"users\")" \
mongo namaste-sync --eval "db.createCollection(\"fhirdata\")" \
mongo namaste-sync --eval "db.createCollection(\"patientdata\")" \
echo "MongoDB initialized successfully" \
mongod --dbpath /data/db --shutdown \
' > /init-mongo.sh && chmod +x /init-mongo.sh

# Create startup script
RUN echo '#!/bin/sh \
echo "Starting NAMASTE-SYNC application..." \
\
# Initialize MongoDB if needed \
if [ ! -f /data/db/.initialized ]; then \
    echo "First-time setup: Initializing MongoDB..." \
    /init-mongo.sh \
    touch /data/db/.initialized \
fi \
\
# Set proper permissions \
chown -R mongodb:mongodb /data/db /var/log/mongodb \
\
# Start supervisor to manage all services \
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf \
' > /start.sh && chmod +x /start.sh

# Create health check script
RUN echo '#!/bin/sh \
# Check if MongoDB is running \
if ! pgrep mongod > /dev/null; then \
    echo "MongoDB is not running" \
    exit 1 \
fi \
\
# Check if nginx is running \
if ! pgrep nginx > /dev/null; then \
    echo "Nginx is not running" \
    exit 1 \
fi \
\
# Check if the app is accessible \
if ! curl -f http://localhost > /dev/null 2>&1; then \
    echo "Application is not accessible" \
    exit 1 \
fi \
\
echo "All services are healthy" \
exit 0 \
' > /healthcheck.sh && chmod +x /healthcheck.sh

# Expose ports
EXPOSE 80 3000 27017

# Set environment variables
ENV NODE_ENV=production
ENV VITE_MONGODB_URI=mongodb://localhost:27017/namaste-sync
ENV VITE_MONGODB_DB_NAME=namaste-sync

# Set volume for persistent data
VOLUME ["/data/db"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /healthcheck.sh

# Start the application
CMD ["/start.sh"]