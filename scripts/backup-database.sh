#!/bin/bash

# ===========================================
# NAMASTE-SYNC Database Backup Script
# ===========================================
# Automated database backup with retention policies
# and cloud storage integration

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_DIR="${PROJECT_ROOT}/logs"
SECRETS_DIR="${PROJECT_ROOT}/secrets"

# Default values
ENVIRONMENT=${1:-production}
BACKUP_TYPE=${2:-full}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
COMPRESS=${COMPRESS:-true}
UPLOAD_TO_CLOUD=${UPLOAD_TO_CLOUD:-false}

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="namaste-sync-${ENVIRONMENT}-${BACKUP_TYPE}-${TIMESTAMP}"
LOG_FILE="${LOG_DIR}/backup_${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"; }

# Initialize
main() {
    log_info "Starting database backup for $ENVIRONMENT environment"
    log_info "Backup type: $BACKUP_TYPE"
    log_info "Backup name: $BACKUP_NAME"

    mkdir -p "$BACKUP_DIR" "$LOG_DIR"

    case $BACKUP_TYPE in
        "full")
            backup_full
            ;;
        "incremental")
            backup_incremental
            ;;
        "mongodb")
            backup_mongodb
            ;;
        "redis")
            backup_redis
            ;;
        *)
            log_error "Unknown backup type: $BACKUP_TYPE"
            exit 1
            ;;
    esac

    cleanup_old_backups

    if [[ "$UPLOAD_TO_CLOUD" == "true" ]]; then
        upload_to_cloud_storage
    fi

    log_success "Backup completed successfully: $BACKUP_NAME"
}

# Full backup
backup_full() {
    log_info "Creating full backup..."

    local backup_path="${BACKUP_DIR}/${BACKUP_NAME}"
    mkdir -p "$backup_path"

    # Backup MongoDB
    backup_mongodb_to_dir "$backup_path"

    # Backup Redis
    backup_redis_to_dir "$backup_path"

    # Backup configuration
    backup_configuration "$backup_path"

    # Create backup metadata
    create_backup_metadata "$backup_path" "full"

    # Compress backup
    if [[ "$COMPRESS" == "true" ]]; then
        compress_backup "$backup_path"
    fi
}

# MongoDB backup
backup_mongodb() {
    log_info "Creating MongoDB backup..."

    local backup_path="${BACKUP_DIR}/${BACKUP_NAME}"
    mkdir -p "$backup_path"

    backup_mongodb_to_dir "$backup_path"
    create_backup_metadata "$backup_path" "mongodb"

    if [[ "$COMPRESS" == "true" ]]; then
        compress_backup "$backup_path"
    fi
}

backup_mongodb_to_dir() {
    local backup_dir="$1"
    local mongo_backup_dir="${backup_dir}/mongodb"

    log_info "Backing up MongoDB data..."

    # Use Docker exec to run mongodump
    if docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" -p namaste-sync ps mongodb | grep -q "Up"; then
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" -p namaste-sync \
            exec -T mongodb mongodump \
            --db namaste-sync \
            --out "/tmp/mongodb_backup_${TIMESTAMP}" \
            --gzip

        # Copy backup from container
        docker cp "namaste-sync_mongodb_1:/tmp/mongodb_backup_${TIMESTAMP}" "$mongo_backup_dir"

        # Cleanup container temp
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" -p namaste-sync \
            exec -T mongodb rm -rf "/tmp/mongodb_backup_${TIMESTAMP}"

        log_success "MongoDB backup completed"
    else
        log_error "MongoDB container is not running"
        exit 1
    fi
}

# Redis backup
backup_redis() {
    log_info "Creating Redis backup..."

    local backup_path="${BACKUP_DIR}/${BACKUP_NAME}"
    mkdir -p "$backup_path"

    backup_redis_to_dir "$backup_path"
    create_backup_metadata "$backup_path" "redis"

    if [[ "$COMPRESS" == "true" ]]; then
        compress_backup "$backup_path"
    fi
}

backup_redis_to_dir() {
    local backup_dir="$1"
    local redis_backup_dir="${backup_dir}/redis"

    log_info "Backing up Redis data..."

    if docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" -p namaste-sync ps redis | grep -q "Up"; then
        # Create Redis backup
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" -p namaste-sync \
            exec -T redis redis-cli BGSAVE

        # Wait for backup to complete
        sleep 5

        # Copy Redis data directory
        docker cp "namaste-sync_redis_1:/data" "$redis_backup_dir"

        log_success "Redis backup completed"
    else
        log_warning "Redis container is not running"
    fi
}

# Backup configuration files
backup_configuration() {
    local backup_dir="$1"
    local config_dir="${backup_dir}/config"

    log_info "Backing up configuration files..."

    mkdir -p "$config_dir"

    # Backup environment files
    cp "$PROJECT_ROOT/.env" "$config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/.env.production" "$config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/backend/.env" "$config_dir/" 2>/dev/null || true

    # Backup Docker compose files
    cp "$PROJECT_ROOT/docker-compose.production.yml" "$config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/Dockerfile.production" "$config_dir/" 2>/dev/null || true

    # Backup nginx configuration
    cp -r "$PROJECT_ROOT/nginx" "$config_dir/" 2>/dev/null || true

    # Backup secrets (encrypted)
    if [[ -d "$SECRETS_DIR" ]]; then
        cp -r "$SECRETS_DIR" "$config_dir/" 2>/dev/null || true
    fi

    log_success "Configuration backup completed"
}

# Create backup metadata
create_backup_metadata() {
    local backup_dir="$1"
    local backup_type="$2"

    cat > "${backup_dir}/backup_metadata.json" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "backup_type": "$backup_type",
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -Iseconds)",
  "created_by": "$(whoami)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "docker_images": $(docker images --format "{{.Repository}}:{{.Tag}}" | jq -R . | jq -s .),
  "components": ["mongodb", "redis", "config"],
  "size_bytes": $(du -sb "$backup_dir" | cut -f1)
}
EOF
}

# Compress backup
compress_backup() {
    local backup_dir="$1"

    log_info "Compressing backup..."

    tar -czf "${backup_dir}.tar.gz" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"
    rm -rf "$backup_dir"

    log_success "Backup compressed: ${backup_dir}.tar.gz"
}

# Clean up old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."

    # Remove backups older than retention period
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    # Keep minimum number of backups
    local backup_count
    backup_count=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f | wc -l)

    if [[ $backup_count -gt 10 ]]; then
        find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | \
            sort -n | head -n -$((backup_count - 10)) | \
            cut -d' ' -f2- | xargs rm -f 2>/dev/null || true
    fi

    log_success "Backup cleanup completed"
}

# Upload to cloud storage (AWS S3 example)
upload_to_cloud_storage() {
    log_info "Uploading backup to cloud storage..."

    if [[ -z "${AWS_S3_BUCKET:-}" ]]; then
        log_warning "AWS_S3_BUCKET not configured, skipping cloud upload"
        return 0
    fi

    local backup_file="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

    if [[ -f "$backup_file" ]]; then
        aws s3 cp "$backup_file" "s3://$AWS_S3_BUCKET/backups/" \
            --storage-class STANDARD_IA \
            --metadata backup-name="$BACKUP_NAME",environment="$ENVIRONMENT"

        log_success "Backup uploaded to S3: s3://$AWS_S3_BUCKET/backups/$(basename "$backup_file")"
    else
        log_error "Backup file not found: $backup_file"
    fi
}

# Run main function
main "$@"