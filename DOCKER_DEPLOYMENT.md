# NAMASTE-SYNC Docker Deployment Guide

## Overview

This guide covers deploying the NAMASTE-SYNC application using Docker. The application includes:
- React/Vite frontend
- MongoDB database for persistent storage
- Nginx reverse proxy
- Complete containerized solution

## Features

✅ **Data Persistence**: MongoDB stores all user data in persistent volumes
✅ **Username Display**: Profile shows username instead of email
✅ **Cleaned Profile**: Removed settings, notifications, help & support
✅ **Dark Mode**: Proper black background theme
✅ **Clone-Ready**: All data stored in MongoDB for easy cloning

## Quick Start

### Prerequisites
- Docker (version 20.0 or higher)
- Docker Compose (version 2.0 or higher)
- 4GB+ available RAM
- 2GB+ available disk space

### Build and Run

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd namaste-sync-33051
   ```

2. **Build and start the application**:
   ```bash
   docker-compose up --build -d
   ```

3. **Access the application**:
   - **Web App**: http://localhost
   - **API**: http://localhost:3000
   - **MongoDB**: localhost:27017

### Alternative: Docker Build Only

If you prefer to use Docker directly without compose:

```bash
# Build the image
docker build -t namaste-sync .

# Run the container
docker run -d \
  --name namaste-sync-app \
  -p 80:80 \
  -p 3000:3000 \
  -p 27017:27017 \
  -v namaste_data:/data/db \
  namaste-sync
```

## Architecture

### Services
- **Web Server**: Nginx serves the React build
- **Application**: Vite preview server for API handling
- **Database**: MongoDB for data storage
- **Process Manager**: Supervisor manages all services

### Ports
- `80` - Main web interface (Nginx)
- `3000` - Application server (Vite)
- `27017` - MongoDB database

### Volumes
- `mongodb_data` - Persistent MongoDB data
- `app_logs` - Application and service logs

## Environment Variables

Key environment variables used:

```env
NODE_ENV=production
VITE_MONGODB_URI=mongodb://localhost:27017/namaste-sync
VITE_MONGODB_DB_NAME=namaste-sync
VITE_APP_ENV=production
```

## Data Management

### Database Structure
- **Users**: User profiles with username support
- **FHIRData**: Medical records and FHIR resources
- **PatientData**: Patient information and medical history

### Backup Data
```bash
# Backup MongoDB data
docker exec namaste-sync-app mongodump --db namaste-sync --out /backup

# Copy backup from container
docker cp namaste-sync-app:/backup ./backup
```

### Restore Data
```bash
# Copy backup to container
docker cp ./backup namaste-sync-app:/backup

# Restore MongoDB data
docker exec namaste-sync-app mongorestore --db namaste-sync /backup/namaste-sync
```

## Health Monitoring

The container includes health checks that verify:
- MongoDB service status
- Nginx service status  
- Application accessibility

Check health status:
```bash
docker ps  # Look for "healthy" status
docker inspect namaste-sync-app --format='{{.State.Health.Status}}'
```

## Logs

View different service logs:

```bash
# All logs
docker-compose logs -f namaste-sync

# Application logs
docker exec namaste-sync-app tail -f /var/log/supervisor/app.out.log

# MongoDB logs
docker exec namaste-sync-app tail -f /var/log/mongodb/mongod.log

# Nginx logs
docker exec namaste-sync-app tail -f /var/log/supervisor/nginx.out.log
```

## Scaling and Production

### Production Recommendations

1. **Use external MongoDB**:
   ```yaml
   # Uncomment MongoDB service in docker-compose.yml
   # Update VITE_MONGODB_URI to point to external instance
   ```

2. **Add SSL/HTTPS**:
   - Configure Nginx with SSL certificates
   - Use Let's Encrypt for automatic SSL

3. **Resource Limits**:
   ```yaml
   services:
     namaste-sync:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 4G
           reservations:
             cpus: '1'
             memory: 2G
   ```

### Multiple Environment Support

Create environment-specific compose files:
- `docker-compose.yml` - Base configuration
- `docker-compose.prod.yml` - Production overrides
- `docker-compose.dev.yml` - Development overrides

Run with specific environment:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: 
   - Change ports in docker-compose.yml if 80, 3000, or 27017 are in use

2. **Memory issues**:
   - Ensure Docker has at least 4GB RAM allocated
   - Monitor memory usage with `docker stats`

3. **MongoDB connection issues**:
   - Check if MongoDB service started properly
   - Verify the connection string in environment variables

4. **Build failures**:
   - Ensure you have sufficient disk space
   - Check if all dependencies are available

### Debug Commands

```bash
# Check container status
docker ps -a

# Enter container shell
docker exec -it namaste-sync-app sh

# Check all running processes in container
docker exec namaste-sync-app ps aux

# View supervisor status
docker exec namaste-sync-app supervisorctl status
```

## Security

### Production Security Checklist

- [ ] Change default MongoDB credentials
- [ ] Configure firewall rules
- [ ] Enable SSL/HTTPS
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup encryption

### Network Security

The application uses Docker networks to isolate services. In production:
- Use Docker secrets for sensitive data
- Implement proper authentication
- Regular security audits

## Updates and Maintenance

### Updating the Application

1. **Pull latest code**:
   ```bash
   git pull origin main
   ```

2. **Rebuild and deploy**:
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

3. **Verify deployment**:
   ```bash
   docker-compose ps
   curl http://localhost/health
   ```

### Regular Maintenance

- Monitor disk usage for MongoDB data
- Regular backups of database
- Update base images periodically
- Monitor application logs for errors

## Support

For issues related to:
- **Docker setup**: Check Docker documentation
- **MongoDB**: Check MongoDB logs in container
- **Application**: Check application logs
- **Network**: Verify port bindings and firewall rules

This deployment solution ensures your NAMASTE-SYNC application is:
- **Portable**: Runs consistently across environments
- **Scalable**: Easy to scale services independently  
- **Maintainable**: Clear separation of concerns
- **Production-ready**: Includes monitoring, logging, and health checks