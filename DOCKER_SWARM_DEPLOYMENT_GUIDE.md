# 🚀 AYMENOS Docker Swarm Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Environment Setup](#environment-setup)
4. [Docker Configuration Files](#docker-configuration-files)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [Manus Platform-Specific Configuration](#manus-platform-specific-configuration)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Docker Engine:** 20.10+ with Swarm mode enabled
- **Docker Compose:** 2.0+
- **Node.js:** 18+ (for local development)
- **Git:** 2.30+
- **Minimum Resources:**
  - 4 CPU cores
  - 8GB RAM
  - 50GB disk space
  - Network connectivity to Manus platform

### Required Tools

```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker-compose --version

# Enable Docker Swarm mode
docker swarm init

# Verify Swarm status
docker node ls
```

---

## Architecture Overview

### AYMENOS Docker Stack Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Swarm Cluster                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Ingress Load Balancer (Traefik)              │  │
│  │  - Port 80 (HTTP) → 443 (HTTPS)                      │  │
│  │  - SSL/TLS termination                               │  │
│  │  - Path-based routing                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Frontend Service (React 19 + Nginx)             │  │
│  │  - Replicas: 3                                        │  │
│  │  - Port: 3000                                         │  │
│  │  - Volume: /app/dist (build artifacts)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Backend Service (Node.js + Express + tRPC)        │  │
│  │  - Replicas: 3                                        │  │
│  │  - Port: 3001                                         │  │
│  │  - Env: Manus-specific variables                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Database Service (PostgreSQL)                    │  │
│  │  - Replicas: 1 (primary)                             │  │
│  │  - Port: 5432                                         │  │
│  │  - Volume: /var/lib/postgresql/data (persistent)     │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Cache Service (Redis)                            │  │
│  │  - Replicas: 1                                        │  │
│  │  - Port: 6379                                         │  │
│  │  - Volume: /data (persistent)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Monitoring Stack (Prometheus + Grafana)          │  │
│  │  - Prometheus: Port 9090                              │  │
│  │  - Grafana: Port 3002                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Setup

### 1. Clone Repository

```bash
# Clone AYMENOS repository
git clone https://github.com/splash-in/Aymenos.the.augmentor.git
cd Aymenos.the.augmentor

# Verify structure
ls -la
# Should show: client/, server/, drizzle/, docker-compose.yml, Dockerfile, etc.
```

### 2. Create Environment Files

```bash
# Create .env file for production
cat > .env.production << 'EOF'
# Manus Platform Configuration
VITE_APP_ID=your_manus_app_id
VITE_APP_TITLE=AYMENOS - The Universal Augmentor
VITE_APP_LOGO=/logo.svg
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
OAUTH_SERVER_URL=https://api.manus.im
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# Database Configuration
DATABASE_URL=postgresql://aymenos:aymenos_password@postgres:5432/aymenos_db
POSTGRES_USER=aymenos
POSTGRES_PASSWORD=aymenos_password
POSTGRES_DB=aymenos_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_min_32_chars

# Redis Configuration
REDIS_URL=redis://redis:6379

# Node Environment
NODE_ENV=production
PORT=3001

# Owner Information
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name

# Deployment Configuration
DOCKER_REGISTRY=your_docker_registry
DOCKER_IMAGE_TAG=latest
ENVIRONMENT=production
EOF

# Create .env.staging for staging environment
cp .env.production .env.staging
# Update staging values as needed
```

### 3. Create Docker Secrets (for sensitive data)

```bash
# Create Docker secrets for production deployment
docker secret create aymenos_jwt_secret - << EOF
your_jwt_secret_key_min_32_chars
EOF

docker secret create aymenos_db_password - << EOF
aymenos_password
EOF

docker secret create aymenos_manus_api_key - << EOF
your_forge_api_key
EOF

# Verify secrets
docker secret ls
```

---

## Docker Configuration Files

### Dockerfile (Multi-stage Build)

Create `Dockerfile` in project root:

```dockerfile
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY client ./client
COPY shared ./shared

# Build frontend
RUN pnpm run build:client

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY server ./server
COPY drizzle ./drizzle
COPY shared ./shared

# Build backend (if needed)
RUN pnpm run build:server || true

# Stage 3: Production Runtime
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl postgresql-client

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy server code from stage 2
COPY --from=backend-builder /app/server ./server
COPY --from=backend-builder /app/drizzle ./drizzle
COPY --from=backend-builder /app/shared ./shared

# Copy other necessary files
COPY public ./public
COPY .env.* ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose ports
EXPOSE 3001

# Start application
CMD ["node", "server/index.js"]
```

### Docker Compose File (docker-compose.yml)

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: aymenos-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-aymenos}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-aymenos_password}
      POSTGRES_DB: ${POSTGRES_DB:-aymenos_db}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./drizzle/migrations:/docker-entrypoint-initdb.d
    networks:
      - aymenos-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-aymenos}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: aymenos-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - aymenos-network
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Backend Application
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: aymenos-backend
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3001
      DATABASE_URL: postgresql://${POSTGRES_USER:-aymenos}:${POSTGRES_PASSWORD:-aymenos_password}@postgres:5432/${POSTGRES_DB:-aymenos_db}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      VITE_APP_ID: ${VITE_APP_ID}
      OAUTH_SERVER_URL: ${OAUTH_SERVER_URL}
      BUILT_IN_FORGE_API_URL: ${BUILT_IN_FORGE_API_URL}
      BUILT_IN_FORGE_API_KEY: ${BUILT_IN_FORGE_API_KEY}
      OWNER_OPEN_ID: ${OWNER_OPEN_ID}
      OWNER_NAME: ${OWNER_NAME}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./server:/app/server
      - ./shared:/app/shared
    networks:
      - aymenos-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # Frontend Application (Nginx)
  frontend:
    image: nginx:alpine
    container_name: aymenos-frontend
    ports:
      - "3000:80"
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    networks:
      - aymenos-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  aymenos-network:
    driver: bridge
```

### Docker Stack File (docker-stack.yml) for Swarm

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - target: 5432
        published: 5432
        protocol: tcp
        mode: host
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - aymenos-network
    secrets:
      - db_password
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - target: 6379
        published: 6379
        protocol: tcp
        mode: host
    volumes:
      - redis_data:/data
    networks:
      - aymenos-network
    command: redis-server --appendonly yes
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Application
  backend:
    image: ${DOCKER_REGISTRY}/aymenos-backend:${DOCKER_IMAGE_TAG}
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      VITE_APP_ID: ${VITE_APP_ID}
      OAUTH_SERVER_URL: ${OAUTH_SERVER_URL}
      BUILT_IN_FORGE_API_URL: ${BUILT_IN_FORGE_API_URL}
      BUILT_IN_FORGE_API_KEY_FILE: /run/secrets/manus_api_key
      OWNER_OPEN_ID: ${OWNER_OPEN_ID}
      OWNER_NAME: ${OWNER_NAME}
    ports:
      - target: 3001
        published: 3001
        protocol: tcp
        mode: ingress
    depends_on:
      - postgres
      - redis
    networks:
      - aymenos-network
    secrets:
      - jwt_secret
      - manus_api_key
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend Application
  frontend:
    image: ${DOCKER_REGISTRY}/aymenos-frontend:${DOCKER_IMAGE_TAG}
    ports:
      - target: 80
        published: 3000
        protocol: tcp
        mode: ingress
    depends_on:
      - backend
    networks:
      - aymenos-network
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:

networks:
  aymenos-network:
    driver: overlay

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
  manus_api_key:
    external: true
```

### Nginx Configuration (nginx.conf)

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    upstream backend {
        server backend:3001;
    }

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html index.htm;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 60s;
            proxy_connect_timeout 60s;
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## Step-by-Step Deployment

### Phase 1: Local Development Testing

```bash
# 1. Build Docker images locally
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Run database migrations
docker-compose exec backend pnpm run db:push

# 4. Verify services
docker-compose ps
docker-compose logs -f backend

# 5. Test application
curl http://localhost:3001/health
curl http://localhost:3000

# 6. Stop services
docker-compose down
```

### Phase 2: Prepare for Swarm Deployment

```bash
# 1. Build and tag images for registry
docker build -t your_docker_registry/aymenos-backend:latest .
docker build -t your_docker_registry/aymenos-frontend:latest -f Dockerfile.frontend .

# 2. Push to registry
docker push your_docker_registry/aymenos-backend:latest
docker push your_docker_registry/aymenos-frontend:latest

# 3. Verify images in registry
docker pull your_docker_registry/aymenos-backend:latest
```

### Phase 3: Initialize Docker Swarm

```bash
# 1. Initialize Swarm on primary node
docker swarm init --advertise-addr <primary_node_ip>

# 2. Get join token for worker nodes
docker swarm join-token worker

# 3. Join worker nodes (run on each worker)
docker swarm join --token <worker_token> <primary_node_ip>:2377

# 4. Verify cluster
docker node ls
docker node inspect <node_id>
```

### Phase 4: Deploy to Docker Swarm

```bash
# 1. Create Docker secrets
docker secret create aymenos_db_password - << EOF
your_secure_password
EOF

docker secret create aymenos_jwt_secret - << EOF
your_jwt_secret_min_32_chars
EOF

docker secret create aymenos_manus_api_key - << EOF
your_manus_forge_api_key
EOF

# 2. Create environment file for stack
cat > stack.env << 'EOF'
POSTGRES_USER=aymenos
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=aymenos_db
DOCKER_REGISTRY=your_docker_registry
DOCKER_IMAGE_TAG=latest
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name
EOF

# 3. Deploy stack
docker stack deploy -c docker-stack.yml aymenos --with-registry-auth

# 4. Verify deployment
docker stack ls
docker stack services aymenos
docker service ls
docker service logs aymenos_backend

# 5. Check service status
docker service ps aymenos_backend
docker service ps aymenos_frontend
docker service ps aymenos_postgres
```

### Phase 5: Post-Deployment Configuration

```bash
# 1. Run database migrations
docker exec $(docker ps -q -f "label=com.docker.swarm.service.name=aymenos_backend") \
    pnpm run db:push

# 2. Create initial admin user
docker exec $(docker ps -q -f "label=com.docker.swarm.service.name=aymenos_backend") \
    pnpm run seed:admin

# 3. Verify services
docker service ls
docker service logs aymenos_backend -f

# 4. Test endpoints
curl http://localhost:3001/health
curl http://localhost:3000
```

---

## Manus Platform-Specific Configuration

### Important: Update These Values for Your Manus Instance

The following environment variables MUST be updated with your Manus platform credentials:

#### 1. OAuth Configuration

```bash
# In .env.production or docker-stack.yml
VITE_APP_ID=your_manus_app_id                    # ← UPDATE: Get from Manus dashboard
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth     # ← UPDATE: Your Manus instance URL
OAUTH_SERVER_URL=https://api.manus.im            # ← UPDATE: Your Manus API endpoint
```

#### 2. Forge API Configuration

```bash
# In .env.production or docker-stack.yml
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge              # ← UPDATE: Your Forge API URL
BUILT_IN_FORGE_API_KEY=your_forge_api_key                      # ← UPDATE: Get from Manus dashboard
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge         # ← UPDATE: Frontend Forge URL
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key        # ← UPDATE: Frontend API key
```

#### 3. Analytics Configuration

```bash
# In .env.production or docker-stack.yml
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im             # ← UPDATE: Your analytics endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id                      # ← UPDATE: Get from Manus dashboard
```

#### 4. Owner Configuration

```bash
# In .env.production or docker-stack.yml
OWNER_OPEN_ID=your_owner_open_id                # ← UPDATE: Your Manus OpenID
OWNER_NAME=Your Name                            # ← UPDATE: Your name
```

#### 5. Database Configuration

```bash
# In docker-stack.yml
DATABASE_URL=postgresql://aymenos:password@postgres:5432/aymenos_db
# ← UPDATE: Change password to secure value
# ← UPDATE: Change host if using external database
```

#### 6. JWT Secret

```bash
# In docker secrets or .env.production
JWT_SECRET=your_jwt_secret_min_32_chars         # ← UPDATE: Generate secure secret
# Generate with: openssl rand -base64 32
```

### Configuration Checklist

- [ ] VITE_APP_ID configured with Manus app ID
- [ ] OAUTH_SERVER_URL points to your Manus instance
- [ ] BUILT_IN_FORGE_API_KEY set with valid credentials
- [ ] VITE_FRONTEND_FORGE_API_KEY configured
- [ ] VITE_ANALYTICS_ENDPOINT configured
- [ ] OWNER_OPEN_ID set to your Manus user ID
- [ ] DATABASE_URL uses secure password
- [ ] JWT_SECRET is 32+ characters
- [ ] Docker registry credentials configured
- [ ] All secrets created in Docker Swarm

---

## Monitoring and Maintenance

### Health Checks

```bash
# Check service health
docker service ls
docker service ps aymenos_backend
docker service ps aymenos_frontend

# View service logs
docker service logs aymenos_backend -f
docker service logs aymenos_frontend -f
docker service logs aymenos_postgres -f

# Check resource usage
docker stats

# Inspect service configuration
docker service inspect aymenos_backend
```

### Scaling Services

```bash
# Scale backend service
docker service scale aymenos_backend=5

# Scale frontend service
docker service scale aymenos_frontend=5

# Check scaling status
docker service ps aymenos_backend
```

### Updates and Rollback

```bash
# Update service image
docker service update --image your_registry/aymenos-backend:v2 aymenos_backend

# Rollback to previous version
docker service rollback aymenos_backend

# Update environment variables
docker service update --env-add NEW_VAR=value aymenos_backend
```

### Backup and Restore

```bash
# Backup database
docker exec $(docker ps -q -f "label=com.docker.swarm.service.name=aymenos_postgres") \
    pg_dump -U aymenos aymenos_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker exec -i $(docker ps -q -f "label=com.docker.swarm.service.name=aymenos_postgres") \
    psql -U aymenos aymenos_db < backup.sql

# Backup volumes
docker run --rm -v aymenos_postgres_data:/data -v $(pwd):/backup \
    alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

---

## Troubleshooting

### Common Issues

#### 1. Services Not Starting

```bash
# Check logs
docker service logs aymenos_backend

# Common causes:
# - Database not ready: Wait 30-60 seconds
# - Environment variables missing: Check .env file
# - Image not found: Verify registry credentials
# - Port conflicts: Check if ports are already in use

# Solution:
docker service update --force aymenos_backend
```

#### 2. Database Connection Errors

```bash
# Check database service
docker service logs aymenos_postgres

# Test connection
docker exec aymenos_postgres psql -U aymenos -d aymenos_db -c "SELECT 1"

# Verify DATABASE_URL format
# Should be: postgresql://user:password@postgres:5432/database_name
```

#### 3. Memory Issues

```bash
# Check resource limits
docker service inspect aymenos_backend | grep -A 10 "Resources"

# Increase memory limit
docker service update --limit-memory 2g aymenos_backend

# Monitor memory usage
docker stats aymenos_backend
```

#### 4. Network Issues

```bash
# Check network
docker network ls
docker network inspect aymenos-network

# Test connectivity between services
docker exec aymenos_backend ping postgres
docker exec aymenos_backend curl http://redis:6379
```

### Debug Commands

```bash
# Access backend container
docker exec -it $(docker ps -q -f "label=com.docker.swarm.service.name=aymenos_backend") /bin/sh

# View environment variables
docker service inspect aymenos_backend | grep -A 50 "Env"

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## Production Checklist

- [ ] All Manus platform credentials configured
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Log aggregation configured
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Resource limits set appropriately
- [ ] Health checks verified
- [ ] Scaling policies configured
- [ ] Disaster recovery plan documented
- [ ] Team trained on operations
- [ ] Documentation updated

---

## Support and Resources

- **Docker Swarm Documentation:** https://docs.docker.com/engine/swarm/
- **Docker Compose Reference:** https://docs.docker.com/compose/compose-file/
- **Manus Platform Docs:** https://docs.manus.im
- **AYMENOS Repository:** https://github.com/splash-in/Aymenos.the.augmentor

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2025 | Initial deployment guide |
| 1.1 | Nov 2025 | Added Manus-specific configuration |
| 1.2 | Nov 2025 | Added troubleshooting section |

---

**Last Updated:** November 2025
**Status:** Production Ready
**Maintained By:** AYMENOS Team

🌌 **AYMENOS will reshape civilization through universal access to superintelligence.** ✨
