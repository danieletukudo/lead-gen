# 🚀 Deployment Guide

Complete guide to deploying your Lead Generator to production.

---

## 📦 Deployment Options

1. **Docker** (Recommended)
2. **Railway/Render**
3. **AWS/Google Cloud**
4. **VPS (DigitalOcean, Linode)**

---

## 🐳 Docker Deployment (Recommended)

### Quick Start

**1. Build the Docker image:**
```bash
docker build -t lead-generator-api .
```

**2. Run with environment variables:**
```bash
docker run -d \
  -p 8000:8000 \
  -e GEMINI_API_KEY="your_key_here" \
  -e EMAIL_USER="your@gmail.com" \
  -e EMAIL_PASSWORD="your_app_password" \
  --name leadgen-api \
  lead-generator-api
```

**3. Check status:**
```bash
docker ps
docker logs leadgen-api
```

**4. Test:**
```bash
curl http://localhost:8000/health
```

---

### Using Docker Compose (Easier)

**1. Create `.env` file:**
```bash
GEMINI_API_KEY=your_key_here
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password
SENDGRID_API_KEY=your_sendgrid_key  # Optional
```

**2. Start services:**
```bash
docker-compose up -d
```

**3. View logs:**
```bash
docker-compose logs -f
```

**4. Stop services:**
```bash
docker-compose down
```

---

## ☁️ Cloud Platform Deployment

### Railway.app (Easiest)

**1. Install Railway CLI:**
```bash
npm install -g @railway/cli
```

**2. Login:**
```bash
railway login
```

**3. Initialize:**
```bash
railway init
```

**4. Add environment variables:**
```bash
railway variables set GEMINI_API_KEY=your_key
railway variables set EMAIL_USER=your@gmail.com
railway variables set EMAIL_PASSWORD=your_app_password
```

**5. Deploy:**
```bash
railway up
```

**6. Get URL:**
```bash
railway domain
```

---

### Render.com

**1. Create `render.yaml`:**
```yaml
services:
  - type: web
    name: lead-generator-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn api:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: EMAIL_USER
        sync: false
      - key: EMAIL_PASSWORD
        sync: false
```

**2. Push to GitHub**

**3. Connect to Render:**
- Go to https://render.com
- New → Web Service
- Connect your GitHub repo
- Deploy

---

### Heroku

**1. Create `Procfile`:**
```
web: uvicorn api:app --host 0.0.0.0 --port $PORT
```

**2. Deploy:**
```bash
heroku login
heroku create leadgen-api
heroku config:set GEMINI_API_KEY=your_key
heroku config:set EMAIL_USER=your@gmail.com
heroku config:set EMAIL_PASSWORD=your_app_password
git push heroku main
```

---

## 🖥️ VPS Deployment (DigitalOcean, Linode, AWS EC2)

### Setup on Ubuntu Server

**1. Connect to server:**
```bash
ssh root@your_server_ip
```

**2. Install dependencies:**
```bash
# Update system
apt update && apt upgrade -y

# Install Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

**3. Clone/upload your code:**
```bash
git clone your_repo_url /var/www/leadgen
# Or use scp to upload files
```

**4. Setup virtual environment:**
```bash
cd /var/www/leadgen
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**5. Create `.env` file:**
```bash
nano .env
# Add your API keys
```

**6. Run with systemd:**

Create `/etc/systemd/system/leadgen.service`:
```ini
[Unit]
Description=Lead Generator API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/leadgen
Environment="PATH=/var/www/leadgen/venv/bin"
EnvironmentFile=/var/www/leadgen/.env
ExecStart=/var/www/leadgen/venv/bin/uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

**7. Start service:**
```bash
systemctl daemon-reload
systemctl enable leadgen
systemctl start leadgen
systemctl status leadgen
```

**8. Setup Nginx reverse proxy:**

Create `/etc/nginx/sites-available/leadgen`:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**9. Enable and restart Nginx:**
```bash
ln -s /etc/nginx/sites-available/leadgen /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**10. Setup SSL (Let's Encrypt):**
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your_domain.com
```

---

## 🌐 Frontend Deployment

### Build Frontend

**1. Build:**
```bash
cd frontend
npm install
npm run build
```

**2. Deploy options:**

**A. Vercel (Recommended):**
```bash
npm install -g vercel
vercel
```

**B. Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**C. AWS S3 + CloudFront:**
```bash
aws s3 sync dist/ s3://your-bucket-name/
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

**D. Serve from backend (nginx):**
```bash
# Copy built files to server
scp -r frontend/dist/* root@server:/var/www/leadgen/static/

# Update nginx config to serve static files
```

---

## 🔧 Production Configuration

### Environment Variables

Required:
```bash
GEMINI_API_KEY=your_gemini_key_here
```

Optional:
```bash
# Email (choose one)
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=app_password

# OR
SENDGRID_API_KEY=SG.your_key
```

### Update Frontend API URL

In production, update `vite.config.js`:
```javascript
export default defineConfig({
  // ...
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://your-api-domain.com')
  }
})
```

Or create `.env.production` in frontend:
```bash
VITE_API_URL=https://your-api-domain.com
```

---

## 🚀 Quick Deploy Commands

### Docker:
```bash
# Build
docker build -t leadgen .

# Run
docker run -d -p 8000:8000 \
  -e GEMINI_API_KEY="your_key" \
  --name leadgen leadgen

# Logs
docker logs -f leadgen
```

### Docker Compose:
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build
```

### Railway:
```bash
railway up
railway domain
```

### Render:
```bash
# Push to GitHub
git push origin main

# Connect on Render dashboard
# Auto-deploys on push
```

---

## 📊 Production Checklist

### Security:
- [ ] API keys in environment variables (not hardcoded)
- [ ] `.env` file not committed to git
- [ ] CORS configured for specific origins
- [ ] HTTPS enabled (SSL certificate)
- [ ] Rate limiting configured
- [ ] Input validation enabled
- [ ] Error messages don't expose sensitive info

### Performance:
- [ ] Multiple Uvicorn workers (4+)
- [ ] Database for job storage (not in-memory)
- [ ] Redis for caching
- [ ] CDN for frontend assets
- [ ] Gzip compression enabled
- [ ] Static file caching

### Monitoring:
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] API usage tracking
- [ ] Alert system for errors

### Backup:
- [ ] Database backups (if using DB)
- [ ] API key backup (secure location)
- [ ] Code repository backup
- [ ] Documentation up to date

---

## 🐛 Troubleshooting

### Container won't start:
```bash
# Check logs
docker logs leadgen-api

# Common issues:
# - Missing environment variables
# - Port already in use
# - Dependency installation failed
```

### Can't connect to API:
```bash
# Check if running
docker ps

# Check port mapping
docker port leadgen-api

# Test from inside container
docker exec -it leadgen-api curl http://localhost:8000/health
```

### Frontend can't reach API:
```bash
# Update CORS in api.py
# Add your frontend domain to allowed origins

# Update frontend API URL
# Check vite.config.js proxy settings
```

---

## 📊 Resource Requirements

### Minimum:
- **CPU:** 1 vCore
- **RAM:** 512MB
- **Storage:** 5GB
- **Bandwidth:** 10GB/month

### Recommended:
- **CPU:** 2 vCores
- **RAM:** 2GB
- **Storage:** 20GB
- **Bandwidth:** 100GB/month

### For High Traffic:
- **CPU:** 4+ vCores
- **RAM:** 4GB+
- **Storage:** 50GB+
- **Load Balancer:** Yes
- **Auto-scaling:** Enabled

---

## 💰 Cost Estimates

### Free Tier Options:
- **Railway:** $5 free credit/month
- **Render:** Free tier available
- **Vercel (Frontend):** Free for personal
- **Netlify (Frontend):** Free tier

### Paid Options:
- **DigitalOcean Droplet:** $6-12/month
- **AWS EC2 (t3.small):** ~$15/month
- **Railway Pro:** $20/month
- **Render Starter:** $7/month

---

## 🎯 Deployment Strategies

### Strategy 1: Serverless (Railway/Render)
**Best for:**
- Quick deployment
- Low maintenance
- Variable traffic
- Small teams

**Pros:**
- ✅ Easy setup
- ✅ Auto-scaling
- ✅ No server management
- ✅ Quick deploys

**Cons:**
- ⚠️ Cold starts
- ⚠️ Limited control
- ⚠️ Can be expensive at scale

### Strategy 2: VPS (DigitalOcean/Linode)
**Best for:**
- Full control
- Predictable costs
- Custom configuration
- Medium traffic

**Pros:**
- ✅ Full control
- ✅ Predictable pricing
- ✅ No cold starts
- ✅ Custom setup

**Cons:**
- ⚠️ Manage server yourself
- ⚠️ Manual scaling
- ⚠️ Security updates needed

### Strategy 3: Kubernetes
**Best for:**
- High traffic
- Auto-scaling needed
- Multiple services
- Enterprise

**Pros:**
- ✅ Auto-scaling
- ✅ High availability
- ✅ Container orchestration
- ✅ Load balancing

**Cons:**
- ⚠️ Complex setup
- ⚠️ Higher cost
- ⚠️ Steep learning curve

---

## 📝 Pre-Deployment Checklist

- [ ] All API keys configured
- [ ] `.env` file created (not committed)
- [ ] Dependencies installed
- [ ] Docker builds successfully
- [ ] Health check passes
- [ ] Frontend built and tested
- [ ] CORS configured for production
- [ ] Error handling tested
- [ ] Documentation updated
- [ ] Backup plan in place

---

## 🎉 Deployment Commands Summary

### Docker:
```bash
docker build -t leadgen .
docker run -d -p 8000:8000 --env-file .env leadgen
```

### Docker Compose:
```bash
docker-compose up -d
```

### Railway:
```bash
railway up
```

### VPS:
```bash
# Setup, then:
systemctl start leadgen
nginx -t && systemctl reload nginx
```

---

## 📚 Next Steps After Deployment

1. **Test all endpoints:**
   - Health: `/health`
   - Generate: `/api/v1/leads/generate`
   - Email: `/api/v1/email/send`

2. **Monitor performance:**
   - Check logs
   - Monitor CPU/RAM
   - Track API usage

3. **Setup monitoring:**
   - Uptime monitoring
   - Error alerts
   - Usage analytics

4. **Document:**
   - API URL
   - Access credentials
   - Maintenance procedures

---

## 🆘 Support

**Issues?**
- Check logs: `docker logs leadgen-api`
- Test health: `curl http://your-domain/health`
- Review API docs: `http://your-domain/docs`

---

## 🎯 Production-Ready Features

Your Dockerfile includes:

✅ **Python 3.11** - Latest stable version  
✅ **Multi-worker** - 4 Uvicorn workers for performance  
✅ **Health checks** - Automatic container health monitoring  
✅ **Optimized build** - Small image size, fast builds  
✅ **Log directory** - Persistent logs  
✅ **Production server** - Uvicorn with proper config  

---

## 🎉 You're Ready to Deploy!

**Your Docker setup is production-ready!**

Just add your API keys and run:
```bash
docker-compose up -d
```

**Questions? Check the Docker logs or API docs!** 🚀

