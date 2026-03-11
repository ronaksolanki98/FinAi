# Docker Quick Start - FinAi

Copy and paste these commands to get started quickly.

## Option 1: Using Docker Compose (Recommended)

```bash
# 1. Create environment file
cp .env.docker.example .env.docker

# 2. Edit .env.docker and add your credentials (use your editor)
# nano .env.docker
# or
# code .env.docker

# 3. Build and start
docker-compose up -d

# 4. View logs
docker-compose logs -f finai

# 5. Stop
docker-compose down
```

## Option 2: Manual Docker Build & Run

```bash
# 1. Build the image
docker build -t finai:latest .

# 2. Run with environment variables
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/.auth-data:/app/.auth-data \
  --env-file .env.docker \
  --name finai \
  finai:latest

# 3. Check status
docker ps

# 4. View logs
docker logs -f finai

# 5. Stop and remove
docker stop finai && docker rm finai
```

## Quick Commands

```bash
# Check if app is running
curl http://localhost:3000/api/ping

# View container logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild (after code changes)
docker-compose up -d --build

# Remove everything
docker-compose down

# View resource usage
docker stats

# Shell into container
docker exec -it finai sh

# View environment variables
docker exec finai env | grep -E "NODE_ENV|PORT|RESEND"
```

## Full Environment Variables

Create `.env.docker` file with:

```env
NODE_ENV=production
PORT=3000
RESEND_API_KEY=your_resend_api_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Testing the Deployment

```bash
# Check API endpoint
curl http://localhost:3000/api/ping

# Check health
curl http://localhost:3000/health 2>/dev/null || echo "API endpoint not found (expected)"

# View frontend
# Open http://localhost:3000 in your browser
```

## Troubleshooting

```bash
# Logs show errors?
docker-compose logs finai | tail -50

# Port in use?
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change port in .env.docker:
# PORT=8000

# Container won't start?
docker-compose up  # Run without -d to see output
```

## For Production Deployment

1. Generate and push image to registry:
```bash
docker build -t your-registry/finai:1.0.0 .
docker push your-registry/finai:1.0.0
```

2. Deploy to your platform (Heroku, AWS, Google Cloud Run, etc.)

3. Set environment variables in your platform's console

See `DOCKER_SETUP.md` for detailed platform-specific instructions.
