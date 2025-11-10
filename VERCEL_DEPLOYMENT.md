# 🚀 Vercel + Railway Deployment Guide

## The Problem You're Having

❌ **Error:** `404 Not Found` on `/api/v1/leads/generate`

**Why:** You deployed the frontend to Vercel, but the backend API is not deployed!

---

## 📦 Two-Part Deployment Required

Your app has TWO parts:
1. **Backend API** (FastAPI/Python) → Deploy to Railway/Render
2. **Frontend** (React/Vite) → Deploy to Vercel

---

## 🚀 Step-by-Step Fix

### **Part 1: Deploy Backend API** (5 minutes)

#### Option A: Railway (Easiest)

**1. Install Railway CLI:**
```bash
npm install -g @railway/cli
```

**2. Login:**
```bash
railway login
```

**3. Deploy backend:**
```bash
railway init
railway up
```

**4. Add environment variables:**
```bash
railway variables set GEMINI_API_KEY="your_NEW_key_here"
railway variables set EMAIL_USER="your@gmail.com"
railway variables set EMAIL_PASSWORD="your_app_password"
railway variables set ENVIRONMENT="production"
railway variables set ALLOWED_ORIGINS="https://lead-gen-rust.vercel.app"
```

**5. Get your API URL:**
```bash
railway domain
```

Copy the URL (e.g., `https://your-app.up.railway.app`)

---

#### Option B: Render.com

**1. Push to GitHub:**
```bash
git add .
git commit -m "Production ready"
git push origin main
```

**2. Go to Render.com:**
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Render detects `render.yaml`
- Add environment variables:
  - `GEMINI_API_KEY`
  - `EMAIL_USER`
  - `EMAIL_PASSWORD`
  - `ENVIRONMENT=production`
  - `ALLOWED_ORIGINS=https://lead-gen-rust.vercel.app`
- Click "Create Web Service"

**3. Get URL:**
- Copy from Render dashboard (e.g., `https://your-api.onrender.com`)

---

### **Part 2: Update Frontend Configuration**

**1. Create `.env.production` file in frontend folder:**
```bash
cd /Users/danielsamuel/PycharmProjects/LEAD-generator/frontend
```

Create file:
```bash
echo "VITE_API_URL=https://your-backend-url.railway.app" > .env.production
```

**Replace with YOUR actual backend URL!**

**2. Rebuild frontend:**
```bash
npm run build
```

**3. Redeploy to Vercel:**
```bash
# If using Vercel CLI:
vercel --prod

# Or commit and push (if connected to GitHub):
git add .
git commit -m "Update API URL"
git push origin main
```

**4. Or set environment variable in Vercel dashboard:**
- Go to Vercel project settings
- Environment Variables
- Add: `VITE_API_URL` = `https://your-backend-url.railway.app`
- Redeploy

---

## 🎯 Architecture Overview

```
User Browser
    ↓
Vercel (Frontend)
https://lead-gen-rust.vercel.app
    ↓
Railway/Render (Backend API)
https://your-app.railway.app
    ↓
Gemini AI + Web Scraping + Email
```

---

## ⚙️ Configuration Files

### Backend `.env`:
```bash
GEMINI_API_KEY=your_NEW_key
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=app_password
ENVIRONMENT=production
ALLOWED_ORIGINS=https://lead-gen-rust.vercel.app
```

### Frontend `.env.production`:
```bash
VITE_API_URL=https://your-backend.railway.app
```

---

## 🔧 Quick Fix Commands

### **1. Deploy Backend:**
```bash
# Railway
railway login
railway init
railway up
railway variables set GEMINI_API_KEY="your_key"
railway variables set ALLOWED_ORIGINS="https://lead-gen-rust.vercel.app"

# Get URL
railway domain
# Copy this URL!
```

### **2. Update Frontend:**
```bash
cd frontend

# Create production env file
echo "VITE_API_URL=https://YOUR-BACKEND-URL.railway.app" > .env.production

# Rebuild
npm run build

# Redeploy to Vercel
vercel --prod
```

---

## ✅ Vercel Environment Variables

Add in Vercel dashboard:
- Go to project settings
- Environment Variables
- Add:
  ```
  Name: VITE_API_URL
  Value: https://your-backend.railway.app
  Environment: Production
  ```
- Redeploy

---

## 🐛 Common Issues

### "Still getting 404"
```
Solution:
1. Verify backend is deployed and running
2. Test: curl https://your-backend.railway.app/health
3. Check VITE_API_URL is correct
4. Rebuild frontend after changing env
5. Clear Vercel cache and redeploy
```

### "CORS error"
```
Solution:
1. Add Vercel URL to ALLOWED_ORIGINS on backend
2. Example: ALLOWED_ORIGINS=https://lead-gen-rust.vercel.app
3. Restart backend
```

### "API key leaked" error
```
Solution:
1. Get NEW API key: https://aistudio.google.com/app/apikey
2. Update backend environment variables
3. Restart backend service
```

---

## 📊 Deployment URLs

After deployment you'll have:

**Frontend (Vercel):**
```
https://lead-gen-rust.vercel.app
```

**Backend (Railway):**
```
https://your-app.up.railway.app
https://your-app.up.railway.app/docs
https://your-app.up.railway.app/health
```

---

## 🔍 Testing After Deployment

**1. Test backend:**
```bash
curl https://your-backend.railway.app/health
```

**2. Test frontend:**
- Open: https://lead-gen-rust.vercel.app
- Open browser console (F12)
- Try generating leads
- Should see API calls going to your backend URL

**3. Check CORS:**
- Look for CORS errors in console
- If found, add Vercel URL to backend ALLOWED_ORIGINS

---

## 📝 Checklist

- [ ] Backend deployed to Railway/Render
- [ ] Backend URL copied
- [ ] Frontend `.env.production` created with backend URL
- [ ] Frontend rebuilt: `npm run build`
- [ ] Frontend redeployed to Vercel
- [ ] Backend ALLOWED_ORIGINS includes Vercel URL
- [ ] NEW Gemini API key configured (not leaked one!)
- [ ] Tested health endpoint
- [ ] Tested lead generation
- [ ] No CORS errors in console

---

## 🎯 Quick Summary

**Your Issue:**
- Frontend: ✅ Deployed on Vercel
- Backend: ❌ NOT deployed

**Solution:**
1. Deploy backend to Railway
2. Update frontend with backend URL
3. Redeploy frontend

---

## 🚀 Fastest Fix (10 minutes)

```bash
# 1. Deploy backend
railway login
railway init
railway up
railway variables set GEMINI_API_KEY="your_NEW_key"
railway variables set ALLOWED_ORIGINS="https://lead-gen-rust.vercel.app"
BACKEND_URL=$(railway domain)

# 2. Update frontend
cd frontend
echo "VITE_API_URL=$BACKEND_URL" > .env.production
npm run build
vercel --prod

# 3. Test
open https://lead-gen-rust.vercel.app
```

---

**Follow these steps and your app will work perfectly!** 🎉

**Remember: You need BOTH parts deployed!** 🚀

