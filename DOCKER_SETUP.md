# Docker Setup Guide - FinAi

This guide covers building and running the FinAi application using Docker, both locally and in production.

## 📋 Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/) (v2.0+)
- Environment variables configured (see below)

## 🚀 Quick Start with Docker Compose

### 1. Create Environment File

```bash
cp .env.docker.example .env.docker
```

Then edit `.env.docker` and add your credentials:
- `RESEND_API_KEY` - Email service API key
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (server-side)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### 2. Run with Docker Compose

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f finai

# Stop the application
docker-compose down
```

The application will be available at `http://localhost:3000`

## 🔨 Manual Docker Build and Run

### Build the Docker Image

```bash
# Build the image
docker build -t finai:latest .

# Or build with a specific version tag
docker build -t finai:1.0.0 .
```

### Run the Container

```bash
# Basic run (requires environment variables)
docker run -p 3000:3000 \
  -e RESEND_API_KEY=your_key \
  -e VITE_GOOGLE_CLIENT_ID=your_id \
  -e GOOGLE_CLIENT_ID=your_id \
  -e GOOGLE_CLIENT_SECRET=your_secret \
  finai:latest

# Run with volume for persistent auth data
docker run -p 3000:3000 \
  -v $(pwd)/.auth-data:/app/.auth-data \
  -e RESEND_API_KEY=your_key \
  -e VITE_GOOGLE_CLIENT_ID=your_id \
  -e GOOGLE_CLIENT_ID=your_id \
  -e GOOGLE_CLIENT_SECRET=your_secret \
  finai:latest

# Run with env file
docker run -p 3000:3000 \
  --env-file .env.docker \
  -v $(pwd)/.auth-data:/app/.auth-data \
  finai:latest
```

## 📦 Docker Compose Configuration

The `docker-compose.yml` file includes:

- **Service**: `finai` - Main application service
- **Ports**: Maps port 3000 (configurable via `PORT` env var)
- **Volumes**: Persists `.auth-data` directory for user authentication
- **Health Check**: Monitors application health every 30 seconds
- **Auto-restart**: Automatically restarts if container crashes
- **Resource Limits**: CPU (2 max, 1 reserved) and Memory (512MB max, 256MB reserved)

### Environment Variables

All variables can be set in `.env.docker`:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `RESEND_API_KEY` | Email API key | `re_xxxxx` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID (server) | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `xxxxx` |
| `PING_MESSAGE` | Custom server message | `FinAi Server is running` |

## 🐳 Docker Image Details

### Multi-Stage Build

The Dockerfile uses a multi-stage build process:

1. **Builder Stage** (node:22-alpine)
   - Installs all dependencies (dev + prod)
   - Builds React client
   - Builds Express server

2. **Runtime Stage** (node:22-alpine)
   - Installs only production dependencies
   - Copies built artifacts from builder stage
   - Smaller final image size

### Base Image

- **Node.js**: v22-alpine (small, secure, latest Node.js)
- **Size**: ~300MB (builder) → ~150MB (runtime)

## 📊 Health Check

The container includes a health check that:
- Runs every 30 seconds
- Has a 10-second timeout
- Waits 5 seconds before first check
- Retries up to 3 times before marking as unhealthy

View health status:
```bash
docker ps  # See health status in output
docker inspect <container-id> | grep -A 20 '"Health"'
```

## 🌍 Deploying to Cloud Platforms

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set RESEND_API_KEY=your_key --app your-app-name
heroku config:set VITE_GOOGLE_CLIENT_ID=your_id --app your-app-name
# ... set other variables

# Push and deploy
git push heroku main
```

### AWS ECS

```bash
# Push image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag finai:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/finai:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/finai:latest

# Create ECS task definition with environment variables
# Create ECS service using the image
```

### Google Cloud Run

```bash
# Configure Docker to use gcloud
gcloud auth configure-docker

# Tag image
docker tag finai:latest gcr.io/<project-id>/finai:latest

# Push image
docker push gcr.io/<project-id>/finai:latest

# Deploy to Cloud Run
gcloud run deploy finai \
  --image gcr.io/<project-id>/finai:latest \
  --platform managed \
  --region us-central1 \
  --port 3000 \
  --set-env-vars RESEND_API_KEY=your_key,VITE_GOOGLE_CLIENT_ID=your_id
```

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and connect
railway login
railway init

# Deploy
railway up
```

### DigitalOcean App Platform

```bash
# Push to registry
docker tag finai:latest registry.digitalocean.com/your-registry/finai:latest
docker push registry.digitalocean.com/your-registry/finai:latest

# Create app.yaml for App Platform deployment
```

## 🔧 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs finai

# Or for direct container run
docker logs <container-id>
```

### Port already in use

```bash
# Change PORT in .env.docker or use different port mapping
docker run -p 8000:3000 ...  # Maps 8000 on host to 3000 in container
```

### Auth data not persisting

```bash
# Ensure volume is properly mounted
docker inspect <container-id> | grep -A 5 '"Mounts"'

# Verify .auth-data directory exists
ls -la .auth-data/
```

### Health check failing

```bash
# Check if server is responding
docker exec <container-id> curl http://localhost:3000/api/ping

# Or from outside
curl http://localhost:3000/api/ping
```

## 📈 Performance Optimization

### Reduce Image Size

```bash
# Use Docker buildkit for better caching
DOCKER_BUILDKIT=1 docker build -t finai:latest .
```

### Resource Monitoring

```bash
# View resource usage
docker stats finai

# Set memory limit
docker run -m 512m ...

# Set CPU limit
docker run --cpus="2" ...
```

## 🔒 Security Best Practices

1. **Don't commit `.env.docker`** - Add to `.gitignore`
2. **Use secrets managers** for production credentials
3. **Run as non-root user** - Create dedicated user in production Dockerfile
4. **Keep Node.js updated** - Regularly update base image version
5. **Scan images** - Use `docker scan` or Trivy to find vulnerabilities

## 🧹 Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi finai:latest

# Clean up unused Docker resources
docker system prune -a

# Remove volumes (warning: deletes data)
docker-compose down -v
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best practices for writing Dockerfiles](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/)
- [Node.js Docker best practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 💡 Tips

- Use `.dockerignore` to exclude unnecessary files and reduce build context
- Multi-stage builds significantly reduce final image size
- Always pin dependency versions in production
- Use health checks for container orchestration
- Store secrets in environment variables, never in code
