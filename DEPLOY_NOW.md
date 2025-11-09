# 🚀 Deploy Your Lead Generator NOW

## Super Quick Deploy (2 Minutes)

### Method 1: Docker Compose (Easiest)

```bash
# 1. Make sure .env exists with your API keys
cat .env

# 2. Run deployment script
./deploy.sh

# Choose option 2 (Docker Compose)
# ✅ Done! API running on http://localhost:8000
```

---

### Method 2: Single Docker Container

```bash
# Build
docker build -t leadgen .

# Run
docker run -d -p 8000:8000 --env-file .env --name leadgen-api leadgen

# Test
curl http://localhost:8000/health
```

---

## 🌐 Deploy to Cloud (5 Minutes)

### Railway.app (Recommended - Free $5 Credit)

**1. Install Railway CLI:**
```bash
npm install -g @railway/cli
```

**2. Login:**
```bash
railway login
```

**3. Deploy:**
```bash
railway init
railway up
```

**4. Add environment variables:**
```bash
railway variables set GEMINI_API_KEY="your_key"
railway variables set EMAIL_USER="your@gmail.com"  
railway variables set EMAIL_PASSWORD="your_app_password"
```

**5. Get your URL:**
```bash
railway domain
```

**✅ Done! Your API is live!**

URL: `https://your-app.up.railway.app`

---

### Render.com (Also Easy)

**1. Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your_repo_url
git push -u origin main
```

**2. Go to Render.com:**
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Render auto-detects `render.yaml`
- Add environment variables in dashboard
- Click "Create Web Service"

**✅ Done! Auto-deploys on every push!**

---

## 📁 What's Been Set Up

### Docker Files:
- ✅ `Dockerfile` - Production container config
- ✅ `docker-compose.yml` - Multi-service orchestration
- ✅ `.dockerignore` - Excludes unnecessary files
- ✅ `deploy.sh` - Automated deployment script

### Configuration:
- ✅ **Python 3.11** - Latest stable
- ✅ **Uvicorn with 4 workers** - Production server
- ✅ **Health checks** - Auto-monitoring
- ✅ **Environment variables** - Secure config
- ✅ **Restart policies** - Auto-recovery

### Cloud Ready:
- ✅ `render.yaml` - Render.com config
- ✅ Port configuration - Dynamic ports
- ✅ Health endpoints - Platform monitoring

---

## 🎯 What Each File Does

### `Dockerfile`
- Builds production container
- Installs dependencies
- Configures Python environment
- Runs Uvicorn with 4 workers
- Port 8000 exposed

### `docker-compose.yml`
- Orchestrates services
- Manages environment variables
- Configures networking
- Sets restart policies
- Volume mapping

### `deploy.sh`
- Interactive deployment
- Checks prerequisites
- Builds and runs containers
- Tests health endpoint
- Shows useful commands

### `render.yaml`
- Render.com configuration
- Auto-deploy setup
- Environment variable mapping
- Health check configuration

---

## 🚀 Recommended Deployment Path

### For Testing:
```bash
./deploy.sh
# Choose Docker Compose
# Test locally first
```

### For Production:
```bash
# Option A: Railway (Easiest)
railway up

# Option B: Render (Auto-deploy)
# Push to GitHub, connect to Render

# Option C: VPS (Most control)
# See DEPLOYMENT.md for full guide
```

---

## 📊 What You Get

### Local Docker:
```
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
Health: http://localhost:8000/health
```

### Railway/Render:
```
Backend API: https://your-app.railway.app
API Docs: https://your-app.railway.app/docs
Health: https://your-app.railway.app/health
```

---

## 🔧 Environment Variables Needed

**Required:**
```bash
GEMINI_API_KEY=your_gemini_api_key
```

**Optional (for email):**
```bash
# Option 1: Yagmail
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password

# Option 2: SendGrid (better)
SENDGRID_API_KEY=SG.your_key
```

---

## ✅ Deployment Checklist

- [ ] `.env` file created with API keys
- [ ] Docker installed and running
- [ ] `deploy.sh` made executable (`chmod +x deploy.sh`)
- [ ] Tested locally first
- [ ] Decided on deployment platform
- [ ] Environment variables configured
- [ ] Health check passes
- [ ] API docs accessible
- [ ] Frontend built (if deploying together)

---

## 🎯 Quick Commands

### Deploy:
```bash
./deploy.sh
```

### View Logs:
```bash
docker-compose logs -f
```

### Stop:
```bash
docker-compose down
```

### Restart:
```bash
docker-compose restart
```

### Update:
```bash
git pull
docker-compose up -d --build
```

---

## 💡 Tips

1. **Start local** - Test with Docker first
2. **Use Railway** - Easiest cloud deploy
3. **Monitor logs** - Check for errors
4. **Test health** - Verify endpoint works
5. **Backup keys** - Save API keys securely

---

## 🐛 Troubleshooting

### "Container won't start"
```bash
docker logs leadgen-api
# Check for missing env vars or errors
```

### "Can't reach API"
```bash
docker ps  # Check if running
curl http://localhost:8000/health  # Test locally
```

### "Health check fails"
```bash
docker exec -it leadgen-api curl http://localhost:8000/health
# Test from inside container
```

---

## 🎉 You're Ready!

**Three Ways to Deploy:**

1. **Quick Local Test:**
   ```bash
   ./deploy.sh
   ```

2. **Railway Cloud:**
   ```bash
   railway up
   ```

3. **Full Production:**
   See `DEPLOYMENT.md`

---

**Choose your method and deploy in minutes!** 🚀

**Questions? Check DEPLOYMENT.md for detailed guides!**

