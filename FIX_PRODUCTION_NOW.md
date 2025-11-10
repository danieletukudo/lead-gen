# 🚨 FIX YOUR PRODUCTION ERROR NOW

## The Problem

Your frontend is on Vercel but trying to call `/api` which doesn't exist there!

```
Frontend (Vercel): ✅ https://lead-gen-rust.vercel.app
Backend (Railway): ❌ NOT DEPLOYED YET!
```

---

## ✅ Quick Fix (10 Minutes)

### **Step 1: Deploy Backend API** (5 min)

```bash
# Install Railway
npm install -g @railway/cli

# Login
railway login

# Deploy
cd /Users/danielsamuel/PycharmProjects/LEAD-generator
railway init
railway up

# Add environment variables
railway variables set GEMINI_API_KEY="your_NEW_key_here"
railway variables set EMAIL_USER="your@gmail.com"
railway variables set EMAIL_PASSWORD="your_app_password"
railway variables set ENVIRONMENT="production"
railway variables set ALLOWED_ORIGINS="https://lead-gen-rust.vercel.app"

# Get your backend URL
railway domain
```

**Copy the URL!** Example: `https://leadgen-production.up.railway.app`

---

### **Step 2: Configure Frontend** (2 min)

```bash
cd /Users/danielsamuel/PycharmProjects/LEAD-generator/frontend

# Option A: Use script (easier)
./configure-production.sh https://YOUR-BACKEND-URL.railway.app

# Option B: Manual
echo "VITE_API_URL=https://YOUR-BACKEND-URL.railway.app" > .env.production
```

---

### **Step 3: Rebuild & Redeploy Frontend** (3 min)

```bash
# Rebuild with new API URL
npm run build

# Redeploy to Vercel
vercel --prod

# Or set in Vercel dashboard:
# Environment Variables → Add:
# Name: VITE_API_URL
# Value: https://YOUR-BACKEND-URL.railway.app
```

---

## 🎯 That's It!

Your app will now work:
```
Frontend (Vercel)
    ↓
Backend (Railway)
    ↓
Gemini AI + Email + Scraping
```

---

## 🔍 Verify It Works

**1. Test backend:**
```bash
curl https://YOUR-BACKEND-URL.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "gemini_api_configured": true
}
```

**2. Test frontend:**
- Open: https://lead-gen-rust.vercel.app
- Open browser console (F12)
- Generate leads
- Should work now! ✅

---

## 🐛 If Still Not Working

### Check 1: Backend Running?
```bash
railway logs
# or
curl https://YOUR-BACKEND-URL.railway.app/health
```

### Check 2: CORS Configured?
Backend needs:
```bash
ALLOWED_ORIGINS=https://lead-gen-rust.vercel.app
```

### Check 3: Frontend Has API URL?
```bash
cat frontend/.env.production
# Should show: VITE_API_URL=https://...
```

### Check 4: Frontend Rebuilt?
```bash
cd frontend
npm run build
vercel --prod
```

---

## 📊 What Each Part Does

### **Backend (Railway/Render):**
- Runs Python/FastAPI
- Connects to Gemini AI
- Web scraping
- Email sending
- Port 8000

### **Frontend (Vercel):**
- Serves React app
- Static files only
- Calls backend API
- No Python/backend code

---

## 💰 Cost

### Free Tiers:
- **Railway:** $5 free credit/month
- **Render:** Free tier (with sleep after inactivity)
- **Vercel:** Free (frontend hosting)

**Total: FREE** (within limits)

---

## 🎯 Alternative: Deploy Backend to Render

If you prefer Render over Railway:

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to render.com
# New Web Service → Connect repo

# 3. Set environment variables in dashboard

# 4. Copy URL from Render

# 5. Update frontend .env.production

# 6. Redeploy frontend
```

---

## ⚡ Super Quick Commands

```bash
# Backend (Railway)
railway login && railway init && railway up
railway variables set GEMINI_API_KEY="your_NEW_key"
railway variables set ALLOWED_ORIGINS="https://lead-gen-rust.vercel.app"
BACKEND_URL=$(railway domain)

# Frontend
cd frontend
echo "VITE_API_URL=$BACKEND_URL" > .env.production
npm run build && vercel --prod
```

---

## ✅ Final Checklist

- [ ] Backend deployed to Railway/Render
- [ ] Backend URL obtained
- [ ] NEW Gemini API key set
- [ ] ALLOWED_ORIGINS includes Vercel URL
- [ ] Frontend `.env.production` created
- [ ] VITE_API_URL set to backend URL
- [ ] Frontend rebuilt
- [ ] Frontend redeployed to Vercel
- [ ] Tested and working

---

## 🎉 After This Works

Your app will be:
- ✅ Fully deployed
- ✅ Backend on Railway
- ✅ Frontend on Vercel
- ✅ Both communicating
- ✅ Ready for users

---

## 🆘 Need Help?

**Test URLs:**
```bash
# Backend health
curl https://YOUR-BACKEND-URL/health

# Backend docs
open https://YOUR-BACKEND-URL/docs

# Frontend
open https://lead-gen-rust.vercel.app
```

**Check logs:**
```bash
# Railway
railway logs

# Render
# Check dashboard

# Vercel
# Check deployment logs in dashboard
```

---

## 🚀 Deploy Backend NOW

**Quick Railway Deploy:**
```bash
railway login
cd /Users/danielsamuel/PycharmProjects/LEAD-generator
railway init
railway up
railway variables set GEMINI_API_KEY="YOUR_NEW_KEY"
railway variables set ALLOWED_ORIGINS="https://lead-gen-rust.vercel.app"
railway domain  # Copy this URL!
```

**Then update frontend and redeploy!**

---

**Fix these two things and your app will work perfectly!** 🎯✨

