# Neon DB Setup Guide - Persistent Database for FinAi

This guide explains how to set up Neon PostgreSQL database for persistent data storage, so your data remains safe even after Docker containers are stopped and restarted.

## 📚 What is Neon?

Neon is a **serverless PostgreSQL database** that provides:
- ✅ Auto-scaling (pay only for what you use)
- ✅ High availability and backups
- ✅ Easy branching for development/staging
- ✅ No infrastructure management needed
- ✅ Free tier with 3 projects and 3GB storage

**Neon Dashboard**: https://console.neon.tech/

---

## 🚀 Quick Start: Neon Cloud Setup

### Step 1: Create Neon Account

1. Go to https://console.neon.tech/
2. Sign up with email or GitHub
3. Create a new project (choose the default settings)

### Step 2: Get Your Connection String

1. In Neon console, go to **Project Dashboard**
2. Click **Connection string** or look for your database connection details
3. Copy the **PostgreSQL connection string** (looks like):
```
postgresql://user:password@ec2-xxx-xxx-xxx-xxx.compute-1.amazonaws.com:5432/your_db?sslmode=require
```

### Step 3: Create Environment File

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` and paste your Neon connection string:

```env
DATABASE_URL=postgresql://user:password@ec2-xxx-xxx-xxx-xxx.compute-1.amazonaws.com:5432/your_db?sslmode=require
RESEND_API_KEY=your_key_here
VITE_GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
```

### Step 4: Run with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f finai

# Check status
docker ps
```

✅ **Your app is now running with persistent Neon database!**

Access it at: http://localhost:3000

---

## 💻 Alternative: Local PostgreSQL Setup

If you prefer **local development** with Docker, you can use the PostgreSQL service included in `docker-compose.yml`:

### Step 1: Update .env.docker

```env
DATABASE_URL=postgresql://finai:finai_secure_password@postgres:5432/finai
POSTGRES_DB=finai
POSTGRES_USER=finai
POSTGRES_PASSWORD=finai_secure_password
```

### Step 2: Run Docker Compose

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL container
- Start FinAi app container
- Initialize the database automatically
- Persist data in `postgres_data` volume

### Step 3: Access PostgreSQL

To connect directly to PostgreSQL:

```bash
# Using psql inside container
docker exec -it finai-postgres psql -U finai -d finai

# Or using a GUI like DBeaver, DataGrip, or pgAdmin
# Connection details:
# Host: localhost
# Port: 5432
# Database: finai
# User: finai
# Password: finai_secure_password
```

---

## 🔑 Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string (required) | `postgresql://user:pass@host:5432/db` |
| `POSTGRES_DB` | Local database name | `finai` |
| `POSTGRES_USER` | Local database user | `finai` |
| `POSTGRES_PASSWORD` | Local database password | `secure_password_here` |
| `POSTGRES_PORT` | Local database port | `5432` |
| `RESEND_API_KEY` | Email service key | `re_xxxxx` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth ID | `xxx.apps.googleusercontent.com` |
| `NODE_ENV` | Environment | `production` or `development` |

---

## 🗄️ Database Schema

The application automatically creates these tables:

### Users Table
```sql
- id (Primary Key)
- email (Unique)
- password_hash
- verified (Boolean)
- created_at
- updated_at
```

### Verification Codes Table
```sql
- id (Primary Key)
- email (Foreign Key)
- code (6-digit code)
- expires_at (Timestamp)
- attempts (Counter)
- created_at
```

### Invoices Table
```sql
- id (Primary Key)
- user_id (Foreign Key)
- message_id (Gmail message ID)
- subject
- from_email
- date
- content
- pdf_url
```

### Transactions Table
```sql
- id (Primary Key)
- user_id (Foreign Key)
- amount
- category
- description
- date
- receipt_url
```

### Budgets Table
```sql
- id (Primary Key)
- user_id (Foreign Key)
- category
- amount
```

### Reminders Table
```sql
- id (Primary Key)
- user_id (Foreign Key)
- title
- description
- due_date
- is_recurring
- recurrence_pattern
- completed
```

---

## 🔄 Data Persistence

### With Docker Compose + Local PostgreSQL

```bash
# Data persists in the postgres_data volume
docker volume ls | grep postgres_data

# Even after stopping containers
docker-compose down

# Data is still there when you restart
docker-compose up -d
```

### With Neon Cloud

Data is **always safe** in Neon's secure cloud servers:
- Automatic daily backups
- Redundant storage
- ACID compliance
- 99.99% uptime SLA

---

## 📊 Monitoring & Management

### Local PostgreSQL

```bash
# View database size
docker exec finai-postgres psql -U finai -d finai -c "\l+"

# View tables
docker exec finai-postgres psql -U finai -d finai -c "\dt"

# Backup database
docker exec finai-postgres pg_dump -U finai finai > backup.sql

# Restore from backup
docker exec -i finai-postgres psql -U finai finai < backup.sql
```

### Neon Cloud

1. Go to https://console.neon.tech/
2. Click on your project
3. View:
   - Database size
   - Queries and performance
   - Connection history
   - Compute resources

---

## 🚨 Troubleshooting

### DATABASE_URL is not set

```
Error: DATABASE_URL environment variable is not set
```

**Fix**: Add `DATABASE_URL` to your `.env.docker` file

### Connection refused (local PostgreSQL)

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Fix**: 
```bash
# Make sure PostgreSQL container is running
docker-compose logs postgres

# Restart containers
docker-compose down && docker-compose up -d
```

### Neon connection timeout

```
Error: connect ETIMEDOUT
```

**Solutions**:
1. Check your internet connection
2. Verify DATABASE_URL is correct (copy from Neon console again)
3. Ensure `?sslmode=require` is in the URL
4. Check if Neon project is active in their console

### Port already in use

```
Error: bind: address already in use
```

**Fix**: Change the port in `.env.docker`:
```env
PORT=8000
POSTGRES_PORT=5433
```

### Schema not created

```
Error: relation "users" does not exist
```

**Fix**: Manually run database initialization
```bash
# For local development
npm run init-db

# Or manually trigger it with Docker
docker-compose exec finai npm run init-db
```

---

## 🔐 Security Best Practices

### Neon Cloud

1. **Use strong passwords** - Neon generates secure passwords by default
2. **Keep connection string private** - Add `.env.docker` to `.gitignore`
3. **Use SSL connections** - Always include `?sslmode=require` in URL
4. **Rotate passwords** - Change in Neon console periodically
5. **IP whitelisting** - Neon supports restricting access by IP

### Local PostgreSQL

1. **Change default password** in `.env.docker`
2. **Don't expose port 5432** outside the Docker network
3. **Use environment variables** instead of hardcoding credentials
4. **Regular backups** - Use `pg_dump` for backups

---

## 📈 Scaling & Production

### Migrating from Local to Neon

If you start with local PostgreSQL and want to move to Neon:

```bash
# 1. Backup local database
docker exec finai-postgres pg_dump -U finai finai > backup.sql

# 2. Get Neon connection string
# (from https://console.neon.tech/)

# 3. Update DATABASE_URL in .env.docker

# 4. Restore data (optional - schema will be auto-created)
# The app will create tables automatically on first run

# 5. Restart
docker-compose down && docker-compose up -d
```

### Neon Scaling

Neon automatically scales with usage:

- **Free tier**: 3 projects, 3GB storage
- **Pro tier**: Larger storage, more compute units
- **Pay-as-you-go**: Only for additional resources

No application code changes needed - Neon handles scaling transparently!

---

## ✅ Verification Checklist

- [ ] Neon account created at https://console.neon.tech/
- [ ] Connection string copied to `.env.docker`
- [ ] `.env.docker` added to `.gitignore` (don't commit secrets!)
- [ ] Other environment variables filled in (RESEND_API_KEY, Google OAuth)
- [ ] `docker-compose up -d` runs successfully
- [ ] Database tables created (check logs)
- [ ] Can sign up and verify email
- [ ] Data persists after `docker-compose down` and `up`
- [ ] Can access app at http://localhost:3000

---

## 🆘 Need Help?

### Neon Support
- Website: https://neon.tech/
- Docs: https://neon.tech/docs/
- Status: https://status.neon.tech/

### PostgreSQL Docs
- Official: https://www.postgresql.org/docs/
- SQL Guide: https://www.postgresql.org/docs/current/sql.html

### Docker Issues
- Docker Docs: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/

---

## 📝 Next Steps

1. ✅ Set up Neon DB (this guide)
2. Configure other services (Resend, Google OAuth)
3. Deploy with Docker to production
4. Set up monitoring and backups
5. Scale as needed

**Your data is now safely persisted in PostgreSQL!** 🎉
