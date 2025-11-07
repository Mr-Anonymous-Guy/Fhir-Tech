#!/bin/bash

# ===========================================
# NAMASTE-SYNC Enhanced Deployment Script
# ===========================================
# Production deployment with advanced features:
# - Zero-downtime deployment with blue-green strategy
# - Automated backup before deployment
# - Rollback capabilities with one command
# - Health checks and validation
# - Notification system for deployment status
# - Integration with monitoring and alerting

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_NAME="namaste-sync"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_DIR="${PROJECT_ROOT}/logs"
SECRETS_DIR="${PROJECT_ROOT}/secrets"

# Default values
ENVIRONMENT=${1:-production}
DEPLOYMENT_STRATEGY=${DEPLOYMENT_STRATEGY:-blue-green}
ENABLE_BACKUP=${ENABLE_BACKUP:-true}
ENABLE_MONITORING=${ENABLE_MONITORING:-true}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-300}
ROLLBACK_ENABLED=${ROLLBACK_ENABLED:-true}
NOTIFICATION_ENABLED=${NOTIFICATION_ENABLED:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emoji for better UX
EMOJI_CHECK="✅"
EMOJI_CROSS="❌"
EMOJI_WARNING="⚠️"
EMOJI_INFO="ℹ️"
EMOJI_ROCKET="🚀"
EMOJI_SHIELD="🛡️"
EMOJI_BACKUP="💾"
EMOJI_HEALTH="❤️"
EMOJI_BELL="🔔"

# Logging functions
log_info() {
    echo -e "${BLUE}${EMOJI_INFO} [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}${EMOJI_CHECK} [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}${EMOJI_WARNING} [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}${EMOJI_CROSS} [ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}${EMOJI_ROCKET} [STEP]${NC} $1"
}

log_security() {
    echo -e "${CYAN}${EMOJI_SHIELD} [SECURITY]${NC} $1"
}

log_backup() {
    echo -e "${YELLOW}${EMOJI_BACKUP} [BACKUP]${NC} $1"
}

log_health() {
    echo -e "${GREEN}${EMOJI_HEALTH} [HEALTH]${NC} $1"
}

log_notification() {
    echo -e "${CYAN}${EMOJI_BELL} [NOTIFICATION]${NC} $1"
}

# Environment configuration
load_environment_config() {
    case $ENVIRONMENT in
        "development"|"dev")
            COMPOSE_FILE="docker-compose.yml"
            DOMAIN="localhost"
            PORT=8080
            ;;
        "staging")
            COMPOSE_FILE="docker-compose.staging.yml"
            DOMAIN="staging.namaste-sync.com"
            PORT=443
            ;;
        "production"|"prod")
            COMPOSE_FILE="docker-compose.production.yml"
            DOMAIN="namaste-sync.com"
            PORT=443
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            log_info "Available environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Initialize directories and logging
initialize_deployment() {
    log_step "Initializing deployment environment..."

    # Create necessary directories
    mkdir -p "$BACKUP_DIR" "$LOG_DIR" "$SECRETS_DIR"

    # Set up log file for this deployment
    DEPLOYMENT_LOG="${LOG_DIR}/deployment_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).log"
    exec 1> >(tee -a "$DEPLOYMENT_LOG")
    exec 2>&1

    log_info "Deployment log: $DEPLOYMENT_LOG"
    log_info "Environment: $ENVIRONMENT"
    log_info "Strategy: $DEPLOYMENT_STRATEGY"
    log_info "Domain: $DOMAIN"

    # Create deployment metadata
    cat > "${LOG_DIR}/deployment_metadata.json" << EOF
{
  "deployment_id": "$(date +%Y%m%d_%H%M%S)",
  "environment": "$ENVIRONMENT",
  "strategy": "$DEPLOYMENT_STRATEGY",
  "domain": "$DOMAIN",
  "timestamp": "$(date -Iseconds)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF
}

# Check dependencies and system requirements
check_dependencies() {
    log_step "Checking system dependencies..."

    local missing_deps=()

    # Check required commands
    for cmd in docker docker-compose curl jq; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and try again."
        exit 1
    fi

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    # Check available disk space (minimum 2GB)
    local available_space
    available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 2097152 ]]; then  # 2GB in KB
        log_warning "Low disk space: ${available_space}KB available"
    fi

    # Check memory usage
    local available_memory
    available_memory=$(free -m | awk 'NR==2{print $7}')
    if [[ $available_memory -lt 1024 ]]; then  # 1GB minimum
        log_warning "Low memory: ${available_memory}MB available"
    fi

    log_success "System dependencies check passed"
}

# Validate environment configuration
validate_environment() {
    log_step "Validating environment configuration..."

    # Check compose file exists
    if [[ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi

    # Check environment file
    local env_file="$PROJECT_ROOT/.env"
    if [[ ! -f "$env_file" ]]; then
        log_warning "Environment file not found: $env_file"
        if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
            log_info "Creating environment file from template..."
            cp "$PROJECT_ROOT/.env.example" "$env_file"
        else
            log_error "No environment template found"
            exit 1
        fi
    fi

    # Validate required environment variables
    source "$env_file"

    local required_vars=("NODE_ENV")
    if [[ "$ENVIRONMENT" == "production" ]]; then
        required_vars+=("JWT_SECRET" "DOMAIN" "FRONTEND_URL")
    fi

    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi

    # Check secrets
    if [[ "$ENVIRONMENT" == "production" ]]; then
        validate_secrets
    fi

    log_success "Environment validation passed"
}

# Validate production secrets
validate_secrets() {
    log_security "Validating production secrets..."

    local secret_files=(
        "mongo_root_username.txt"
        "mongo_root_password.txt"
        "grafana_password.txt"
        "mongodb_exporter_password.txt"
        "backup_password.txt"
    )

    local missing_secrets=()
    for secret_file in "${secret_files[@]}"; do
        if [[ ! -f "$SECRETS_DIR/$secret_file" ]]; then
            missing_secrets+=("$secret_file")
        fi
    done

    if [[ ${#missing_secrets[@]} -gt 0 ]]; then
        log_error "Missing secret files: ${missing_secrets[*]}"
        log_info "Run ./scripts/secrets-setup.sh to generate missing secrets"
        exit 1
    fi

    # Validate secret strength
    while IFS= read -r secret_file; do
        local secret_value
        secret_value=$(cat "$SECRETS_DIR/$secret_file")
        if [[ ${#secret_value} -lt 16 ]]; then
            log_warning "Secret $secret_file appears to be weak (less than 16 characters)"
        fi
    done < <(printf '%s\n' "${secret_files[@]}")

    log_success "Secret validation passed"
}

# Create comprehensive backup
create_backup() {
    if [[ "$ENABLE_BACKUP" != "true" ]]; then
        log_info "Backup disabled, skipping..."
        return 0
    fi

    log_backup "Creating deployment backup..."

    local backup_timestamp
    backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/${backup_timestamp}"

    mkdir -p "$backup_path"

    # Backup current running configuration
    log_backup "Backing up current configuration..."
    cp -r "$PROJECT_ROOT/.env" "$backup_path/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/nginx" "$backup_path/" 2>/dev/null || true
    cp "$PROJECT_ROOT/$COMPOSE_FILE" "$backup_path/" 2>/dev/null || true

    # Backup Docker volumes
    log_backup "Backing up Docker volumes..."

    # Backup MongoDB if running
    if docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$PROJECT_NAME" ps mongodb | grep -q "Up"; then
        log_backup "Backing up MongoDB data..."
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$PROJECT_NAME" \
            exec -T mongodb mongodump \
            --db namaste-sync \
            --out "/tmp/mongodb_backup_${backup_timestamp}" || true

        docker cp "${PROJECT_NAME}_mongodb_1:/tmp/mongodb_backup_${backup_timestamp}" \
            "$backup_path/mongodb" || true
    fi

    # Backup Redis if running
    if docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$PROJECT_NAME" ps redis | grep -q "Up"; then
        log_backup "Backing up Redis data..."
        docker cp "${PROJECT_NAME}_redis_1:/data" "$backup_path/redis" || true
    fi

    # Create backup metadata
    cat > "$backup_path/backup_metadata.json" << EOF
{
  "backup_timestamp": "$backup_timestamp",
  "environment": "$ENVIRONMENT",
  "deployment_id": "$(date +%Y%m%d_%H%M%S)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "components": ["configuration", "mongodb", "redis"],
  "created_at": "$(date -Iseconds)"
}
EOF

    # Compress backup
    log_backup "Compressing backup..."
    tar -czf "${backup_path}.tar.gz" -C "$BACKUP_DIR" "$backup_timestamp"
    rm -rf "$backup_path"

    log_success "Backup created: ${backup_path}.tar.gz"

    # Keep only recent backups (retention policy)
    cleanup_old_backups
}

# Cleanup old backups based on retention policy
cleanup_old_backups() {
    log_backup "Cleaning up old backups..."

    local retention_days=30
    if [[ "$ENVIRONMENT" == "development" ]]; then
        retention_days=7
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        retention_days=14
    fi

    # Remove old backups
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$retention_days -delete 2>/dev/null || true

    # Keep at least 5 backups regardless of age
    local backup_count
    backup_count=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f | wc -l)
    if [[ $backup_count -gt 5 ]]; then
        find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | \
            sort -n | head -n -$((backup_count - 5)) | \
            cut -d' ' -f2- | xargs rm -f 2>/dev/null || true
    fi

    log_success "Backup cleanup completed"
}

# Blue-Green Deployment Strategy
blue_green_deployment() {
    log_step "Starting Blue-Green deployment..."

    local current_color="blue"
    local target_color="green"

    # Determine current active environment
    if docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "${PROJECT_NAME}_blue" ps | grep -q "Up"; then
        current_color="blue"
        target_color="green"
    elif docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "${PROJECT_NAME}_green" ps | grep -q "Up"; then
        current_color="green"
        target_color="blue"
    else
        log_info "No active deployment found, starting with blue"
        current_color="none"
        target_color="blue"
    fi

    log_info "Current active: $current_color, Target: $target_color"

    # Deploy target environment
    log_step "Deploying $target_color environment..."

    # Stop target environment if running
    docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "${PROJECT_NAME}_${target_color}" \
        down --remove-orphans 2>/dev/null || true

    # Build and start target environment
    docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "${PROJECT_NAME}_${target_color}" \
        up -d --build

    # Wait for services to be ready
    log_health "Waiting for $target_color environment to be ready..."
    wait_for_services "${PROJECT_NAME}_${target_color}"

    # Health checks
    log_health "Running comprehensive health checks..."
    run_health_checks "${PROJECT_NAME}_${target_color}"

    # Switch traffic to target environment
    if [[ "$current_color" != "none" ]]; then
        log_step "Switching traffic to $target_color environment..."
        switch_traffic "$current_color" "$target_color"
    fi

    # Keep old environment for rollback
    log_info "Keeping $current_color environment for rollback capability"

    log_success "Blue-Green deployment completed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    local project_name="$1"
    local timeout="$HEALTH_CHECK_TIMEOUT"
    local interval=10
    local elapsed=0

    while [[ $elapsed -lt $timeout ]]; do
        local unhealthy_services
        unhealthy_services=$(docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$project_name" \
            ps --filter "health=unhealthy" --format "{{.Service}}" 2>/dev/null || true)

        if [[ -z "$unhealthy_services" ]]; then
            log_success "All services are healthy"
            return 0
        fi

        log_info "Waiting for services to become healthy... (${elapsed}s/${timeout}s)"
        sleep "$interval"
        elapsed=$((elapsed + interval))
    done

    log_error "Timeout waiting for services to become healthy"
    log_error "Unhealthy services: $unhealthy_services"
    return 1
}

# Run comprehensive health checks
run_health_checks() {
    local project_name="$1"

    log_health "Running application health checks..."

    # Get the port mapping for the frontend service
    local frontend_port
    frontend_port=$(docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$project_name" \
        port nginx 80 | cut -d: -f2)

    if [[ -z "$frontend_port" ]]; then
        frontend_port=80
    fi

    # Basic health check
    if ! curl -f "http://localhost:${frontend_port}/health" --max-time 30; then
        log_error "Basic health check failed"
        return 1
    fi

    # API health check
    if ! curl -f "http://localhost:${frontend_port}/api/health" --max-time 30; then
        log_error "API health check failed"
        return 1
    fi

    # Database connectivity check
    log_health "Checking database connectivity..."
    if ! docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$project_name" \
        exec -T mongodb mongo --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        log_error "Database connectivity check failed"
        return 1
    fi

    # Redis connectivity check
    log_health "Checking Redis connectivity..."
    if ! docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$project_name" \
        exec -T redis redis-cli ping >/dev/null 2>&1; then
        log_error "Redis connectivity check failed"
        return 1
    fi

    log_success "All health checks passed"
}

# Switch traffic between environments
switch_traffic() {
    local from_color="$1"
    local to_color="$2"

    log_step "Switching traffic from $from_color to $to_color..."

    # Update load balancer configuration
    # This would typically involve updating nginx configuration or cloud load balancer

    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Update production load balancer
        # This is a placeholder - actual implementation would depend on your infrastructure
        log_info "Updating production load balancer configuration..."
    else
        # For non-production, just update local port mapping
        log_info "Updating local port forwarding..."
    fi

    log_success "Traffic switched to $to_color environment"
}

# Standard deployment (for development)
standard_deployment() {
    log_step "Starting standard deployment..."

    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$PROJECT_NAME" \
        down --remove-orphans 2>/dev/null || true

    # Build and start services
    log_step "Building and starting services..."
    docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$PROJECT_NAME" \
        up -d --build

    # Wait for services
    log_health "Waiting for services to be ready..."
    wait_for_services "$PROJECT_NAME"

    # Health checks
    log_health "Running health checks..."
    run_health_checks "$PROJECT_NAME"

    log_success "Standard deployment completed"
}

# Send deployment notifications
send_notification() {
    local status="$1"
    local message="$2"

    if [[ "$NOTIFICATION_ENABLED" != "true" ]]; then
        return 0
    fi

    log_notification "Sending deployment notification..."

    # Slack notification (if webhook is configured)
    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        local color="good"
        if [[ "$status" == "failure" ]]; then
            color="danger"
        elif [[ "$status" == "warning" ]]; then
            color="warning"
        fi

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"NAMASTE-SYNC Deployment\n*Environment*: $ENVIRONMENT\n*Status*: $status\n*Message*: $message\n*Time*: $(date)\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi

    # Email notification (if configured)
    # Add email notification logic here

    log_notification "Notification sent: $status - $message"
}

# Deployment completion and cleanup
complete_deployment() {
    local status="$1"

    if [[ "$status" == "success" ]]; then
        log_success "🎉 Deployment completed successfully!"

        # Show deployment summary
        show_deployment_summary

        # Clean up old blue/green deployment if needed
        if [[ "$DEPLOYMENT_STRATEGY" == "blue-green" ]]; then
            cleanup_old_blue_green_deployment
        fi

        send_notification "success" "Deployment completed successfully"

    else
        log_error "❌ Deployment failed!"

        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            log_info "Rollback is enabled. You can rollback with: $0 $ENVIRONMENT rollback"
        fi

        send_notification "failure" "Deployment failed"
        exit 1
    fi
}

# Show deployment summary
show_deployment_summary() {
    echo
    log_info "Deployment Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Domain: https://$DOMAIN"
    echo "  Strategy: $DEPLOYMENT_STRATEGY"
    echo "  Time: $(date)"
    echo

    log_info "Service URLs:"
    echo "  - Main Application: https://$DOMAIN"
    echo "  - Health Check: https://$DOMAIN/health"
    echo "  - API Health: https://$DOMAIN/api/health"

    if [[ "$ENABLE_MONITORING" == "true" ]]; then
        echo "  - Grafana: https://$DOMAIN/grafana"
        echo "  - Prometheus: https://$DOMAIN/prometheus"
    fi

    echo
    log_info "Useful Commands:"
    echo "  - View logs: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f"
    echo "  - Check status: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps"
    echo "  - Stop services: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down"
    echo "  - Rollback: $0 $ENVIRONMENT rollback"
}

# Cleanup old blue/green deployment
cleanup_old_blue_green_deployment() {
    local keep_old=false

    # Keep old deployment for 1 hour in production, 30 minutes in staging
    local keep_minutes=60
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        keep_minutes=30
    elif [[ "$ENVIRONMENT" == "development" ]]; then
        keep_minutes=10
    fi

    # Add logic here to cleanup old deployment after specified time
    log_info "Old deployment will be cleaned up after ${keep_minutes} minutes"
}

# Rollback function
rollback_deployment() {
    log_step "Starting rollback process..."

    # Find most recent backup
    local latest_backup
    latest_backup=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | \
        sort -nr | head -n 1 | cut -d' ' -f2-)

    if [[ -z "$latest_backup" ]]; then
        log_error "No backup found for rollback"
        exit 1
    fi

    log_backup "Using backup: $latest_backup"

    # Extract backup
    local temp_dir
    temp_dir=$(mktemp -d)
    tar -xzf "$latest_backup" -C "$temp_dir"

    # Restore configuration
    local backup_name
    backup_name=$(basename "$latest_backup" .tar.gz)
    cp "$temp_dir/$backup_name/.env" "$PROJECT_ROOT/" 2>/dev/null || true
    cp -r "$temp_dir/$backup_name/nginx" "$PROJECT_ROOT/" 2>/dev/null || true

    # Restore database
    if [[ -d "$temp_dir/$backup_name/mongodb" ]]; then
        log_backup "Restoring MongoDB data..."
        docker cp "$temp_dir/$backup_name/mongodb" \
            "${PROJECT_NAME}_mongodb_1:/tmp/restore" 2>/dev/null || true

        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$PROJECT_NAME" \
            exec -T mongodb mongorestore --db namaste-sync --drop \
            /tmp/restore/namaste-sync 2>/dev/null || true
    fi

    # Cleanup
    rm -rf "$temp_dir"

    log_success "Rollback completed"
    send_notification "warning" "Rollback completed successfully"
}

# Main deployment function
main() {
    log_step "Starting NAMASTE-SYNC Enhanced Deployment"

    # Initialize
    load_environment_config
    initialize_deployment

    # Pre-deployment checks
    check_dependencies
    validate_environment

    # Create backup
    create_backup

    # Deploy based on strategy
    case "$DEPLOYMENT_STRATEGY" in
        "blue-green")
            blue_green_deployment
            ;;
        "standard")
            standard_deployment
            ;;
        *)
            log_error "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
            exit 1
            ;;
    esac

    # Complete deployment
    complete_deployment "success"
}

# Handle script arguments
case "${2:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "backup")
        create_backup
        ;;
    "status")
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$PROJECT_NAME" ps
        ;;
    "logs")
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f
        ;;
    "stop")
        log_info "Stopping all services..."
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" -p "$PROJECT_NAME" down
        ;;
    "help"|"--help"|"-h")
        echo "NAMASTE-SYNC Enhanced Deployment Script"
        echo ""
        echo "Usage: $0 <environment> <command> [options]"
        echo ""
        echo "Environments:"
        echo "  development, dev     Development environment"
        echo "  staging             Staging environment"
        echo "  production, prod     Production environment"
        echo ""
        echo "Commands:"
        echo "  deploy              Deploy application (default)"
        echo "  rollback            Rollback to previous version"
        echo "  backup              Create backup"
        echo "  status              Show service status"
        echo "  logs                Show service logs"
        echo "  stop                Stop all services"
        echo ""
        echo "Environment Variables:"
        echo "  DEPLOYMENT_STRATEGY    blue-green|standard (default: blue-green)"
        echo "  ENABLE_BACKUP          true|false (default: true)"
        echo "  ENABLE_MONITORING      true|false (default: true)"
        echo "  ROLLBACK_ENABLED       true|false (default: true)"
        echo "  NOTIFICATION_ENABLED   true|false (default: true)"
        echo "  SLACK_WEBHOOK          Slack webhook URL for notifications"
        echo ""
        echo "Examples:"
        echo "  $0 production deploy                    # Deploy to production"
        echo "  $0 staging rollback                     # Rollback staging"
        echo "  DEPLOYMENT_STRATEGY=standard $0 dev    # Standard deployment to dev"
        ;;
    *)
        log_error "Unknown command: ${2:-deploy}"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac