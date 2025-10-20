#!/bin/bash

# NAMASTE-SYNC Remote Deployment Script
# Usage: ./deploy.sh [environment] [options]

set -e

# Default values
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="namaste-sync"
REGISTRY=""
BUILD_ARGS=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Environment-specific configurations
case $ENVIRONMENT in
    "development"|"dev")
        COMPOSE_FILE="docker-compose.yml"
        BUILD_ARGS="--target development"
        ;;
    "production"|"prod")
        COMPOSE_FILE="docker-compose.prod.yml"
        BUILD_ARGS="--target production"
        ;;
    "staging")
        COMPOSE_FILE="docker-compose.staging.yml"
        BUILD_ARGS="--target production"
        ;;
    *)
        log_error "Unknown environment: $ENVIRONMENT"
        log_info "Available environments: development, production, staging"
        exit 1
        ;;
esac

# Function to check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Function to validate environment
validate_environment() {
    log_info "Validating environment configuration..."
    
    if [ ! -f ".env" ]; then
        log_warning ".env file not found, creating from template..."
        cp .env.example .env 2>/dev/null || {
            log_error "No .env.example template found"
            exit 1
        }
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Function to build and deploy
deploy() {
    log_info "Starting deployment for $ENVIRONMENT environment..."
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans 2>/dev/null || true
    
    # Remove old images if requested
    if [[ "$*" == *"--clean"* ]]; then
        log_info "Cleaning old images..."
        docker system prune -f
        docker image prune -a -f
    fi
    
    # Build images
    log_info "Building application images..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build $BUILD_ARGS
    
    # Start services
    log_info "Starting services..."
    if [[ "$*" == *"--monitoring"* ]]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" --profile monitoring up -d
    else
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    fi
    
    # Wait for services to be healthy
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    log_info "Performing health checks..."
    if curl -f http://localhost/health &> /dev/null; then
        log_success "Application is healthy and accessible"
    else
        log_error "Health check failed"
        show_logs
        exit 1
    fi
    
    log_success "Deployment completed successfully!"
    show_status
}

# Function to show service status
show_status() {
    echo
    log_info "Service Status:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
    
    echo
    log_info "Access URLs:"
    echo "  - Main Application: http://localhost"
    echo "  - Health Check: http://localhost/health"
    
    if [[ "$*" == *"--monitoring"* ]]; then
        echo "  - MongoDB UI: http://localhost:8081"
        echo "  - Portainer: http://localhost:9000"
    fi
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo
        log_info "Production Notes:"
        echo "  - Configure SSL certificates in nginx/ssl/"
        echo "  - Update DNS records to point to this server"
        echo "  - Consider setting up automated backups"
    fi
}

# Function to show logs
show_logs() {
    log_info "Recent logs:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs --tail=50
}

# Function to backup data
backup() {
    log_info "Creating backup..."
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup MongoDB data
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T namaste-sync mongodump --db namaste-sync --out /tmp/backup
    docker cp "${PROJECT_NAME}_namaste-sync_1:/tmp/backup" "$BACKUP_DIR/"
    
    # Backup configuration
    cp -r nginx "$BACKUP_DIR/"
    cp .env "$BACKUP_DIR/"
    cp "$COMPOSE_FILE" "$BACKUP_DIR/"
    
    log_success "Backup created: $BACKUP_DIR"
}

# Function to restore from backup
restore() {
    local backup_dir=$1
    if [ -z "$backup_dir" ]; then
        log_error "Please specify backup directory"
        exit 1
    fi
    
    log_info "Restoring from backup: $backup_dir"
    
    # Restore configuration
    cp "$backup_dir/.env" .
    cp -r "$backup_dir/nginx" .
    
    # Restore MongoDB data
    docker cp "$backup_dir/backup" "${PROJECT_NAME}_namaste-sync_1:/tmp/"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T namaste-sync mongorestore --db namaste-sync --drop /tmp/backup/namaste-sync
    
    log_success "Restore completed"
}

# Function to show usage
show_usage() {
    echo "NAMASTE-SYNC Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  development, dev     Deploy for development"
    echo "  production, prod     Deploy for production (default)"
    echo "  staging             Deploy for staging"
    echo ""
    echo "Options:"
    echo "  --clean             Clean old Docker images before build"
    echo "  --monitoring        Enable monitoring services"
    echo "  --backup            Create backup before deployment"
    echo "  --logs              Show recent logs"
    echo "  --status            Show current status"
    echo "  --stop              Stop all services"
    echo "  --restart           Restart all services"
    echo ""
    echo "Examples:"
    echo "  $0 production --clean --monitoring"
    echo "  $0 development --logs"
    echo "  $0 --backup"
}

# Main script logic
case "${2:-deploy}" in
    "deploy")
        check_dependencies
        validate_environment
        
        if [[ "$*" == *"--backup"* ]]; then
            backup
        fi
        
        deploy "$@"
        ;;
    "backup")
        backup
        ;;
    "restore")
        restore "$3"
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        log_info "Stopping all services..."
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting services..."
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" restart
        log_success "Services restarted"
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        log_error "Unknown command: ${2:-deploy}"
        show_usage
        exit 1
        ;;
esac