# Neon DB Quick Start - 5 Minutes

## Option A: Cloud Neon (Recommended)

### 1️⃣ Create Neon Account (1 min)
```bash
# Go to https://console.neon.tech/
# Sign up with email or GitHub
# Create a new project
```

### 2️⃣ Copy Connection String (1 min)
```bash
# In Neon dashboard, copy your PostgreSQL connection string
# It looks like: postgresql://user:password@host:5432/db?sslmode=require
```

### 3️⃣ Create Environment File (1 min)
```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker`:
```env
DATABASE_URL=postgresql://your_user:your_password@host:5432/your_db?sslmode=require
RESEND_API_KEY=your_key
VITE_GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

### 4️⃣ Run Docker (2 min)
```bash
docker-compose up -d
docker-compose logs -f finai  # Watch it start
```

✅ **Done!** Visit http://localhost:3000

---

## Option B: Local PostgreSQL (for development)

### 1️⃣ Edit Environment File (1 min)
```bash
cp .env.docker.example .env.docker
```

Make sure DATABASE_URL points to local PostgreSQL:
```env
DATABASE_URL=postgresql://finai:finai_secure_password@postgres:5432/finai
```

### 2️⃣ Run Docker (1 min)
```bash
docker-compose up -d
```

### 3️⃣ Done! (2 min)
```bash
# Check it's running
docker ps

# View logs
docker-compose logs -f finai

# Access app
# http://localhost:3000
```

---

## Verify It Works

```bash
# Check database is running
docker-compose ps

# See if tables were created
docker exec finai-postgres psql -U finai -d finai -c "\dt"

# Test the API
curl http://localhost:3000/api/ping
# Should return: {"message":"ping"}
```

## Important Files

- `.env.docker` - Your credentials (don't commit!)
- `docker-compose.yml` - Services config
- `server/db.ts` - Database connection
- `NEON_DB_SETUP.md` - Full guide

## Common Issues

```bash
# Container won't start?
docker-compose logs finai

# PostgreSQL not responding?
docker-compose restart postgres

# Wrong DATABASE_URL?
# Edit .env.docker and restart:
docker-compose down && docker-compose up -d
```

## Next Steps

1. ✅ Database is running
2. Sign up: http://localhost:3000/signup
3. Verify email using demo code
4. Upload expenses
5. Check Insights page

**Data persists even after restarting Docker!** 🎉

See `NEON_DB_SETUP.md` for detailed guide.
