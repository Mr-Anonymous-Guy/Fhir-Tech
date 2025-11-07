#!/bin/bash

# ===========================================
# NAMASTE-SYNC Configuration Setup Script
# ===========================================
# This script helps set up the environment configuration
# for first-time deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to generate secure random string
generate_secure_string() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
    else
        # Fallback to /dev/urandom
        head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32
    fi
}

# Function to validate environment
validate_environment() {
    local env_name="$1"
    print_info "Validating $env_name environment..."

    # Check if required files exist
    if [[ ! -f ".env.example" ]]; then
        print_error ".env.example file not found!"
        exit 1
    fi

    if [[ "$env_name" == "production" && ! -f "backend/.env.example" ]]; then
        print_error "backend/.env.example file not found!"
        exit 1
    fi

    print_success "Environment validation passed"
}

# Function to setup frontend environment
setup_frontend_env() {
    local env_name="$1"
    print_info "Setting up frontend environment ($env_name)..."

    # Copy appropriate template
    local env_file=".env"
    if [[ "$env_name" == "staging" ]]; then
        cp .env.staging "$env_file"
    elif [[ "$env_name" == "production" ]]; then
        cp .env.production "$env_file"
    else
        cp .env.development "$env_file"
    fi

    print_success "Frontend environment configured"
}

# Function to setup backend environment
setup_backend_env() {
    local env_name="$1"
    print_info "Setting up backend environment ($env_name)..."

    local backend_env_file="backend/.env"

    # Copy backend template
    if [[ -f "backend/.env.example" ]]; then
        cp backend/.env.example "$backend_env_file"

        # Generate secure JWT secret for production
        if [[ "$env_name" == "production" ]]; then
            local jwt_secret=$(generate_secure_string)
            sed -i "s/your-super-secret-jwt-key-change-in-production-min-32-chars/$jwt_secret/" "$backend_env_file"
            print_success "Generated secure JWT secret"
        fi

        # Update NODE_ENV
        sed -i "s/NODE_ENV=development/NODE_ENV=$env_name/" "$backend_env_file"

        # Update CORS settings for production
        if [[ "$env_name" == "production" ]]; then
            read -p "Enter your production domain (e.g., https://yourdomain.com): " domain
            if [[ -n "$domain" ]]; then
                sed -i "s|FRONTEND_URL=http://localhost:8080|FRONTEND_URL=$domain|" "$backend_env_file"
                sed -i "s|ALLOWED_ORIGINS=http://localhost:8080,http://localhost:4173|ALLOWED_ORIGINS=$domain|" "$backend_env_file"
            fi
        fi

        print_success "Backend environment configured"
    else
        print_error "Backend .env.example not found"
        exit 1
    fi
}

# Function to test database connectivity
test_database_connection() {
    print_info "Testing database connectivity..."

    # Check if MongoDB is running (for development)
    if [[ "$env_name" == "development" ]]; then
        if command -v mongosh >/dev/null 2>&1; then
            if mongosh --eval "db.adminCommand('ismaster')" >/dev/null 2>&1; then
                print_success "MongoDB is running and accessible"
            else
                print_warning "MongoDB is not running. Please start MongoDB before proceeding."
            fi
        else
            print_warning "MongoDB client not found. Please install MongoDB."
        fi
    fi
}

# Function to validate required environment variables
validate_env_vars() {
    print_info "Validating environment variables..."

    # Check frontend environment
    if [[ -f ".env" ]]; then
        local missing_vars=()

        while IFS= read -r line; do
            if [[ $line =~ ^VITE_.*=your_ ]]; then
                local var_name=$(echo "$line" | cut -d'=' -f1)
                missing_vars+=("$var_name")
            fi
        done < .env

        if [[ ${#missing_vars[@]} -gt 0 ]]; then
            print_warning "The following environment variables need to be updated:"
            printf '%s\n' "${missing_vars[@]}"
            print_info "Please edit .env file and update the placeholder values."
        else
            print_success "Frontend environment variables look good"
        fi
    fi

    # Check backend environment
    if [[ -f "backend/.env" ]]; then
        if grep -q "your-super-secret-jwt-key" backend/.env; then
            print_error "JWT secret is still using default value. Please update it in backend/.env"
        else
            print_success "Backend environment variables look good"
        fi
    fi
}

# Function to provide next steps
provide_next_steps() {
    print_header "Next Steps"

    cat << EOF
${GREEN}Configuration setup completed!${NC}

${YELLOW}To continue with deployment:${NC}

1. Review and update any placeholder values in:
   - .env (frontend configuration)
   - backend/.env (backend configuration)

2. For production deployment:
   - Update Supabase credentials
   - Configure your domain name
   - Set up SSL certificates

3. Start the application:
   - Development: npm run dev
   - Production: docker-compose -f docker-compose.production.yml up -d

4. For more information, see:
   - README.md
   - docs/deployment-guide.md

EOF
}

# Main script execution
main() {
    print_header "NAMASTE-SYNC Configuration Setup"

    # Check if we're in the right directory
    if [[ ! -f "package.json" && ! -f "../package.json" ]]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Prompt for environment selection
    echo "Select environment to configure:"
    echo "1) development"
    echo "2) staging"
    echo "3) production"
    read -p "Enter choice (1-3): " choice

    case $choice in
        1)
            env_name="development"
            ;;
        2)
            env_name="staging"
            ;;
        3)
            env_name="production"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac

    print_info "Setting up $env_name environment..."

    # Execute setup steps
    validate_environment "$env_name"
    setup_frontend_env "$env_name"
    setup_backend_env "$env_name"
    test_database_connection
    validate_env_vars
    provide_next_steps

    print_success "Configuration setup completed! 🎉"
}

# Run main function
main "$@"