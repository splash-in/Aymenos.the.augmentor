# 🌌 AYMENOS Standalone Deployment Guide

## 100% Independent - Zero Manus Dependency

This guide explains how to deploy AYMENOS as a completely standalone application with zero dependencies on the Manus platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Deployment](#deployment)
7. [Operations](#operations)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Standalone AYMENOS?

Standalone AYMENOS is a complete, self-contained distributed AGI platform that:

- **Zero External Dependencies:** No reliance on Manus platform
- **Complete Authentication:** Built-in user registration, login, password reset
- **Distributed Learning:** Federated learning without external APIs
- **Governance System:** Blockchain-based voting and proposals
- **Credits Economy:** Humanity Credits system
- **Inference Network:** Distributed model serving
- **Production Ready:** Enterprise-grade security and scalability

### Key Features

✅ **Standalone Authentication**
- User registration and login
- Email verification
- Password reset
- Session management
- JWT tokens

✅ **Distributed Models**
- Model registry
- Version control
- Domain-specific LLMs
- Federated learning

✅ **Governance**
- Democratic proposals
- Quadratic voting
- Transparent decision-making
- Blockchain verification

✅ **Economy**
- Humanity Credits (HC)
- Contribution tracking
- Credit distribution
- Transfer system

✅ **Inference**
- Distributed inference nodes
- Load balancing
- Latency optimization
- Quality assurance

---

## Architecture

### Standalone AYMENOS Stack

```
┌─────────────────────────────────────────────────────────────┐
│                  AYMENOS Standalone Stack                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Frontend Layer (React 19 + TypeScript)       │  │
│  │  - User authentication UI                            │  │
│  │  - Model marketplace                                 │  │
│  │  - Governance dashboard                              │  │
│  │  - Inference interface                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Backend Layer (Node.js + Express + tRPC)        │  │
│  │  - Standalone authentication service                 │  │
│  │  - Model management                                  │  │
│  │  - Inference orchestration                           │  │
│  │  - Governance voting                                 │  │
│  │  - Credits management                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Data Layer (PostgreSQL + Redis)              │  │
│  │  - User accounts and sessions                        │  │
│  │  - Model metadata                                    │  │
│  │  - Governance proposals                              │  │
│  │  - Credits ledger                                    │  │
│  │  - Inference history                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Distributed Layer (P2P + Blockchain)            │  │
│  │  - P2P network (libp2p)                              │  │
│  │  - Federated learning                                │  │
│  │  - Inference nodes                                   │  │
│  │  - Blockchain governance (optional)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### System Requirements

- **OS:** Linux, macOS, or Windows (with WSL2)
- **Node.js:** 18.0.0 or higher
- **PostgreSQL:** 13.0 or higher
- **Redis:** 6.0 or higher
- **Docker:** 20.10+ (optional, for containerized deployment)
- **Git:** 2.30+

### Software Requirements

```bash
# Node.js and npm
node --version  # Should be v18+
npm --version

# PostgreSQL
psql --version  # Should be 13+

# Redis
redis-cli --version  # Should be 6+

# Git
git --version  # Should be 2.30+
```

### Network Requirements

- **Ports:** 3000 (frontend), 3001 (backend), 5432 (database), 6379 (redis)
- **Internet:** For npm package installation
- **DNS:** For email verification (optional)

---

## Installation

### Step 1: Clone Repository

```bash
# Clone AYMENOS
git clone https://github.com/splash-in/Aymenos.the.augmentor.git
cd Aymenos.the.augmentor

# Verify structure
ls -la
# Should show: client/, server/, drizzle/, package.json, etc.
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install
# or
pnpm install
# or
yarn install

# Verify installation
npm list | head -20
```

### Step 3: Setup Database

```bash
# Create PostgreSQL database
createdb aymenos_db

# Create database user
createuser aymenos -P  # Will prompt for password

# Grant privileges
psql -U postgres -d aymenos_db << EOF
GRANT ALL PRIVILEGES ON DATABASE aymenos_db TO aymenos;
ALTER ROLE aymenos WITH CREATEDB;
EOF

# Verify connection
psql -U aymenos -d aymenos_db -c "SELECT 1"
```

### Step 4: Setup Redis

```bash
# Start Redis server
redis-server

# In another terminal, verify connection
redis-cli ping
# Should respond with: PONG
```

### Step 5: Run Database Migrations

```bash
# Create environment file
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://aymenos:your_password@localhost:5432/aymenos_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_min_32_chars_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars_change_in_production
NODE_ENV=development
PORT=3001
EOF

# Run migrations
npm run db:push
# or
pnpm run db:push
```

---

## Configuration

### Environment Variables

Create `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://aymenos:password@localhost:5432/aymenos_db

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret_min_32_chars_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars_change_in_production

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Email (optional, for password reset)
EMAIL_PROVIDER=smtp  # or 'sendgrid', 'mailgun'
EMAIL_FROM=noreply@aymenos.local
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password

# Security
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your_session_secret_change_in_production

# Logging
LOG_LEVEL=info
```

### Production Configuration

For production deployment, use `.env.production`:

```bash
# Database (use managed service like AWS RDS)
DATABASE_URL=postgresql://aymenos:secure_password@db.example.com:5432/aymenos_prod

# Redis (use managed service like AWS ElastiCache)
REDIS_URL=redis://cache.example.com:6379

# Authentication
JWT_SECRET=generate_with_openssl_rand_base64_32
JWT_REFRESH_SECRET=generate_with_openssl_rand_base64_32

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://aymenos.example.com

# Email
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@aymenos.example.com
SENDGRID_API_KEY=your_sendgrid_key

# Security
CORS_ORIGIN=https://aymenos.example.com
SESSION_SECRET=generate_with_openssl_rand_base64_32

# Logging
LOG_LEVEL=warn
```

### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32

# Generate random password
openssl rand -base64 16
```

---

## Deployment

### Local Development

```bash
# Start backend
npm run dev:backend
# or
pnpm run dev:backend

# In another terminal, start frontend
npm run dev:client
# or
pnpm run dev:client

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

### Docker Deployment

```bash
# Build Docker image
docker build -t aymenos:latest .

# Run container
docker run -d \
  --name aymenos \
  -p 3001:3001 \
  -e DATABASE_URL=postgresql://aymenos:password@postgres:5432/aymenos_db \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET=your_secret \
  aymenos:latest

# Verify container
docker logs aymenos
docker ps | grep aymenos
```

### Docker Compose Deployment

```bash
# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Docker Swarm Deployment

```bash
# Initialize Swarm
docker swarm init

# Create secrets
docker secret create aymenos_db_password - << EOF
your_secure_password
EOF

# Deploy stack
docker stack deploy -c docker-stack.yml aymenos

# Verify deployment
docker stack services aymenos
docker service logs aymenos_backend -f
```

### Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace aymenos

# Create secrets
kubectl create secret generic aymenos-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=jwt-secret=... \
  -n aymenos

# Deploy application
kubectl apply -f k8s/deployment.yaml -n aymenos

# Verify deployment
kubectl get pods -n aymenos
kubectl logs -f deployment/aymenos-backend -n aymenos
```

---

## Operations

### Health Checks

```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
curl http://localhost:3000

# Check database connection
psql -U aymenos -d aymenos_db -c "SELECT 1"

# Check Redis
redis-cli ping
```

### Backup and Restore

```bash
# Backup database
pg_dump -U aymenos aymenos_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql -U aymenos aymenos_db < backup.sql

# Backup Redis
redis-cli BGSAVE
# Data saved to /var/lib/redis/dump.rdb
```

### Monitoring

```bash
# Monitor logs
tail -f logs/aymenos.log

# Monitor system resources
docker stats

# Monitor database
psql -U aymenos -d aymenos_db -c "SELECT * FROM pg_stat_statements LIMIT 10;"

# Monitor Redis
redis-cli INFO stats
```

### Scaling

```bash
# Scale backend service (Docker Swarm)
docker service scale aymenos_backend=5

# Scale frontend service
docker service scale aymenos_frontend=3

# Verify scaling
docker service ps aymenos_backend
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```bash
# Check PostgreSQL is running
psql -U aymenos -d aymenos_db -c "SELECT 1"

# Check DATABASE_URL format
# Should be: postgresql://user:password@host:port/database

# Verify credentials
psql -U aymenos -h localhost -d aymenos_db -c "SELECT 1"
```

#### 2. Redis Connection Error

```bash
# Check Redis is running
redis-cli ping

# Check REDIS_URL format
# Should be: redis://host:port

# Verify connection
redis-cli -h localhost -p 6379 ping
```

#### 3. JWT Token Errors

```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Generate new secret if needed
openssl rand -base64 32

# Update .env file and restart
```

#### 4. Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev:backend
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev:backend

# Enable TypeScript debugging
node --inspect-brk server/index.js

# Connect debugger
# Chrome: chrome://inspect
# VS Code: Debug > Attach to Process
```

---

## Production Checklist

- [ ] Database backed up daily
- [ ] Redis persistence enabled
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Logging aggregation set up
- [ ] Monitoring and alerting configured
- [ ] Backup and restore tested
- [ ] Disaster recovery plan documented
- [ ] Team trained on operations
- [ ] Security audit completed

---

## Support and Resources

- **Documentation:** https://github.com/splash-in/Aymenos.the.augmentor
- **Issues:** https://github.com/splash-in/Aymenos.the.augmentor/issues
- **Discussions:** https://github.com/splash-in/Aymenos.the.augmentor/discussions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2025 | Initial standalone deployment guide |

---

**Status:** Production Ready
**Maintained By:** AYMENOS Team
**Last Updated:** November 2025

🌌 **AYMENOS: Completely Standalone, Completely Free, Completely Yours.** ✨
