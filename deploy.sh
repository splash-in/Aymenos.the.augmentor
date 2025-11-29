#!/bin/bash

# AYMENOS Docker Swarm Deployment Script
# Automates the entire deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-your_docker_registry}"
DOCKER_IMAGE_TAG="${DOCKER_IMAGE_TAG:-latest}"
STACK_NAME="${STACK_NAME:-aymenos}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker found: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    log_success "Docker Compose found: $(docker-compose --version)"
    
    # Check if Docker Swarm is initialized
    if ! docker info | grep -q "Swarm: active"; then
        log_warning "Docker Swarm is not active"
        read -p "Initialize Docker Swarm? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker swarm init
            log_success "Docker Swarm initialized"
        else
            log_error "Docker Swarm is required for deployment"
            exit 1
        fi
    fi
    log_success "Docker Swarm is active"
}

# Load environment variables
load_environment() {
    log_info "Loading environment variables..."
    
    ENV_FILE=".env.${ENVIRONMENT}"
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
    
    set -a
    source "$ENV_FILE"
    set +a
    
    log_success "Environment loaded from $ENV_FILE"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build backend image
    log_info "Building backend image..."
    docker build -t "${DOCKER_REGISTRY}/aymenos-backend:${DOCKER_IMAGE_TAG}" \
        -f Dockerfile.backend .
    log_success "Backend image built"
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -t "${DOCKER_REGISTRY}/aymenos-frontend:${DOCKER_IMAGE_TAG}" \
        -f Dockerfile.frontend .
    log_success "Frontend image built"
}

# Push images to registry
push_images() {
    log_info "Pushing images to registry..."
    
    log_info "Pushing backend image..."
    docker push "${DOCKER_REGISTRY}/aymenos-backend:${DOCKER_IMAGE_TAG}"
    log_success "Backend image pushed"
    
    log_info "Pushing frontend image..."
    docker push "${DOCKER_REGISTRY}/aymenos-frontend:${DOCKER_IMAGE_TAG}"
    log_success "Frontend image pushed"
}

# Create Docker secrets
create_secrets() {
    log_info "Creating Docker secrets..."
    
    # Check if secrets already exist
    if docker secret ls | grep -q "aymenos_db_password"; then
        log_warning "Secret 'aymenos_db_password' already exists, skipping..."
    else
        log_info "Creating secret: aymenos_db_password"
        echo "${POSTGRES_PASSWORD}" | docker secret create aymenos_db_password -
        log_success "Secret created: aymenos_db_password"
    fi
    
    if docker secret ls | grep -q "aymenos_jwt_secret"; then
        log_warning "Secret 'aymenos_jwt_secret' already exists, skipping..."
    else
        log_info "Creating secret: aymenos_jwt_secret"
        echo "${JWT_SECRET}" | docker secret create aymenos_jwt_secret -
        log_success "Secret created: aymenos_jwt_secret"
    fi
    
    if docker secret ls | grep -q "aymenos_manus_api_key"; then
        log_warning "Secret 'aymenos_manus_api_key' already exists, skipping..."
    else
        log_info "Creating secret: aymenos_manus_api_key"
        echo "${BUILT_IN_FORGE_API_KEY}" | docker secret create aymenos_manus_api_key -
        log_success "Secret created: aymenos_manus_api_key"
    fi
}

# Deploy stack
deploy_stack() {
    log_info "Deploying Docker Stack..."
    
    docker stack deploy -c docker-stack.yml "${STACK_NAME}" --with-registry-auth
    
    log_success "Stack deployed: ${STACK_NAME}"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        local backend_ready=$(docker service ls --filter "name=${STACK_NAME}_backend" --format "{{.Replicas}}" | grep -o "^[0-9]*" || echo "0")
        
        if [ "$backend_ready" -gt 0 ]; then
            log_success "Services are ready"
            return 0
        fi
        
        echo -ne "\rWaiting for services... (attempt $((attempt+1))/$max_attempts)"
        sleep 1
        ((attempt++))
    done
    
    log_warning "Services did not become ready within timeout"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    local backend_container=$(docker ps -q -f "label=com.docker.swarm.service.name=${STACK_NAME}_backend" | head -1)
    
    if [ -z "$backend_container" ]; then
        log_warning "Backend container not found, skipping migrations"
        return 1
    fi
    
    docker exec "$backend_container" pnpm run db:push
    log_success "Database migrations completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check services
    log_info "Services status:"
    docker service ls --filter "label=com.docker.stack.namespace=${STACK_NAME}"
    
    # Check service replicas
    log_info "Service replicas:"
    docker service ls --filter "label=com.docker.stack.namespace=${STACK_NAME}" --format "table {{.Name}}\t{{.Replicas}}"
    
    # Check service logs
    log_info "Recent service logs:"
    docker service logs "${STACK_NAME}_backend" --tail 20 2>/dev/null || true
    
    log_success "Deployment verification completed"
}

# Display deployment summary
deployment_summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}AYMENOS Deployment Summary${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo "Stack Name: ${STACK_NAME}"
    echo "Environment: ${ENVIRONMENT}"
    echo "Docker Registry: ${DOCKER_REGISTRY}"
    echo "Image Tag: ${DOCKER_IMAGE_TAG}"
    echo ""
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:3001"
    echo "Database: postgres:5432"
    echo "Redis: redis:6379"
    echo ""
    echo "Useful Commands:"
    echo "  View services: docker service ls"
    echo "  View logs: docker service logs ${STACK_NAME}_backend -f"
    echo "  Scale service: docker service scale ${STACK_NAME}_backend=5"
    echo "  Remove stack: docker stack rm ${STACK_NAME}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

# Main deployment flow
main() {
    log_info "Starting AYMENOS deployment..."
    echo ""
    
    check_prerequisites
    echo ""
    
    load_environment
    echo ""
    
    read -p "Build Docker images? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_images
        echo ""
    fi
    
    read -p "Push images to registry? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_images
        echo ""
    fi
    
    create_secrets
    echo ""
    
    deploy_stack
    echo ""
    
    wait_for_services
    echo ""
    
    read -p "Run database migrations? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_migrations
        echo ""
    fi
    
    verify_deployment
    echo ""
    
    deployment_summary
    
    log_success "AYMENOS deployment completed successfully!"
}

# Run main function
main "$@"
