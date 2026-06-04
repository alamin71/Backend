# Docker Deployment Guide

Complete guide for running this backend template with Docker and Docker Compose.

**Author:** Al-Amin (alamincse1001@gmail.com)

---

## 📦 Prerequisites

- Docker installed (v20.10+)
- Docker Compose installed (v2.0+)

**Install Docker:**

- **Windows/Mac:** [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:**
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  ```

**Verify Installation:**

```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

### Step 1: Clone Repository

```bash
git clone https://github.com/alamin71/Backend-Template.git
cd Backend-Template
```

### Step 2: Configure Environment

```bash
# Copy Docker environment template
cp .env.docker .env

# Edit with your values
nano .env
```

**Important variables to update:**

```env
# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-secure-secret-here
JWT_REFRESH_SECRET=your-secure-refresh-secret-here

# Email Configuration (for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# MongoDB Credentials
MONGO_USERNAME=admin
MONGO_PASSWORD=strong-password-here
```

### Step 3: Build and Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check running containers
docker ps
```

### Step 4: Verify

```bash
# Test API
curl http://localhost:5000/

# Should return health check response
```

**Services running:**

- Backend API: `http://localhost:5000`
- Socket.IO: `http://localhost:5001`
- MongoDB: `localhost:27017`

---

## 🛠️ Docker Commands

### Start Services

```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Deletes database)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f mongodb

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up -d --build

# Force rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

## 🗄️ Database Management

### Access MongoDB Shell

```bash
# Using Docker exec
docker exec -it mongodb mongosh

# With authentication
docker exec -it mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
```

### Backup Database

```bash
# Create backup
docker exec mongodb mongodump -u admin -p admin123 --authenticationDatabase admin --out /data/backup

# Copy backup to host
docker cp mongodb:/data/backup ./mongodb-backup
```

### Restore Database

```bash
# Copy backup to container
docker cp ./mongodb-backup mongodb:/data/restore

# Restore
docker exec mongodb mongorestore -u admin -p admin123 --authenticationDatabase admin /data/restore
```

### View Database

```bash
# Connect to MongoDB
docker exec -it mongodb mongosh -u admin -p admin123

# In mongosh:
use backend_template
show collections
db.users.find().pretty()
```

---

## 🔧 Development with Docker

### Hot Reload Development

**docker-compose.dev.yml:**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: npm run dev
```

**Dockerfile.dev:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000 5001

CMD ["npm", "run", "dev"]
```

**Run in dev mode:**

```bash
docker-compose -f docker-compose.dev.yml up
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
# Windows:
netstat -ano | findstr :5000

# Linux/Mac:
lsof -i :5000

# Change port in .env
PORT=5002
SOCKET_PORT=5003

# Restart
docker-compose down
docker-compose up -d
```

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check container status
docker ps -a

# Remove and rebuild
docker-compose down
docker-compose up -d --build
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify DATABASE_URL in .env
# Should be: mongodb://admin:admin123@mongodb:27017/backend_template?authSource=admin

# Restart MongoDB
docker-compose restart mongodb
```

### Email Not Sending

```bash
# Check logs
docker-compose logs backend | grep email

# Verify EMAIL_* variables in .env
# For Gmail, use App Password, not account password

# Test email config
docker exec -it backend-template node -e "console.log(process.env.EMAIL_USER)"
```

### Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test .
```

---

## 📊 Monitoring

### Health Checks

```bash
# Check health status
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' backend-template | jq
```

### Resource Usage

```bash
# View resource stats
docker stats

# Specific container
docker stats backend-template mongodb
```

---

## 🚀 Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml backend-stack

# List services
docker service ls

# Scale backend
docker service scale backend-stack_backend=3

# Remove stack
docker stack rm backend-stack
```

### Using Kubernetes

**Convert to Kubernetes:**

```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.28.0/kompose-linux-amd64 -o kompose
chmod +x kompose
sudo mv kompose /usr/local/bin/

# Convert
kompose convert

# Deploy
kubectl apply -f .
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` file**

   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use secrets management in production**
   - Docker Swarm secrets
   - Kubernetes secrets
   - AWS Secrets Manager
   - HashiCorp Vault

3. **Run as non-root user**

   Update Dockerfile:

   ```dockerfile
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nodejs -u 1001
   USER nodejs
   ```

4. **Scan for vulnerabilities**

   ```bash
   docker scan backend-template
   ```

5. **Update base images regularly**
   ```bash
   docker pull node:18-alpine
   docker-compose build --no-cache
   ```

---

## 📝 Docker Compose Variants

### Production (Multi-stage Build)

**Dockerfile.prod:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 5000 5001

USER node

CMD ["node", "dist/server.js"]
```

### With Redis Cache

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    networks:
      - backend-network

volumes:
  redis_data:
```

### With Nginx Reverse Proxy

```yaml
services:
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - backend-network
```

---

## 🎯 Next Steps

- Set up CI/CD pipeline (GitHub Actions, GitLab CI)
- Configure monitoring (Prometheus + Grafana)
- Set up log aggregation (ELK Stack)
- Implement backup automation
- Configure auto-scaling

---

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

## 🆘 Support

For Docker-related issues:

- Check logs: `docker-compose logs`
- Review [DEPLOYMENT.md](DEPLOYMENT.md)
- Contact: alamincse1001@gmail.com

Happy Dockerizing! 🐳
