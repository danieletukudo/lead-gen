# 🔧 Local Development Fix

## The Problem

Your frontend was trying to call the wrong API URL:
```
❌ Calling: http://localhost:3000/api/v1/leads/generate
✅ Should call: http://localhost:8000/api/v1/leads/generate
```

---

## ✅ What I Fixed

Updated `vite.config.js` proxy to point to your local API server:

**Before:**
```javascript
target: 'https://leadgenerator.meallensai.com'  // Production URL
```

**After:**
```javascript
target: 'http://localhost:8000'  // Local API
```

---

## 🚀 How to Fix Now

### **Step 1: Make sure API is running**

**Terminal 1:**
```bash
cd /Users/danielsamuel/PycharmProjects/LEAD-generator
python api.py
```

Should see:
```
🚀 Lead Generator API Starting...
Running on http://0.0.0.0:8000
```

---

### **Step 2: Restart Frontend**

**Terminal 2:**
```bash
cd /Users/danielsamuel/PycharmProjects/LEAD-generator/frontend

# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

Should see:
```
VITE ready in XXX ms
Local: http://localhost:3000
```

---

### **Step 3: Test**

1. Open: http://localhost:3000
2. Should see landing page
3. Click "Get Started"
4. Generate test leads
5. Should work now! ✅

---

## 🎯 Development vs Production

### **Local Development:**
```
Frontend: http://localhost:3000
Backend:  http://localhost:8000
Proxy:    Vite proxies /api → localhost:8000
```

### **Production:**
```
Frontend: https://lead-gen-rust.vercel.app
Backend:  https://lead-gen-aes4.onrender.com
Direct:   Frontend calls backend directly
```

---

## 🔍 Verify It Works

### **Test API Connection:**
```bash
# In browser console (F12):
fetch('/api/v1/leads/generate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    industry: 'test',
    number: 1,
    country: 'USA',
    enable_web_scraping: false
  })
})
```

Should return 200 OK

---

## 🐛 If Still Not Working

### **Check 1: Backend Running?**
```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status":"healthy","gemini_api_configured":true}
```

### **Check 2: Frontend Dev Server Restarted?**
```bash
# Must restart after vite.config.js changes!
# Ctrl+C then npm run dev
```

### **Check 3: Ports Correct?**
```
Backend: Port 8000 ✅
Frontend: Port 3000 ✅
```

---

## ✅ Quick Fix Commands

```bash
# Terminal 1 - Backend
cd /Users/danielsamuel/PycharmProjects/LEAD-generator
python api.py

# Terminal 2 - Frontend (new terminal)
cd /Users/danielsamuel/PycharmProjects/LEAD-generator/frontend
npm run dev

# Browser
open http://localhost:3000
```

---

## 📊 Configuration Summary

### **vite.config.js:**
- ✅ Proxy `/api` → `localhost:8000`
- ✅ Proxy `/health` → `localhost:8000`
- ✅ Port 3000
- ✅ Change origin enabled

### **api.js:**
- ✅ Development: Uses proxy (empty string)
- ✅ Production: Uses VITE_API_URL env var
- ✅ Auto-detects environment

---

## 🎯 What Changed

**File:** `frontend/vite.config.js`

**Change:**
```javascript
// Old (pointed to production)
target: 'https://leadgenerator.meallensai.com'

// New (points to local)
target: 'http://localhost:8000'
```

**Effect:**
- Local dev now works
- Production still works (uses different config)
- No need to change for deployment

---

## 🚀 Restart Both Servers

**Terminal 1:**
```bash
python api.py
# Should see: Running on http://0.0.0.0:8000
```

**Terminal 2:**
```bash
cd frontend
# Ctrl+C to stop
npm run dev
# Should see: Local: http://localhost:3000
```

**Browser:**
```
http://localhost:3000
```

---

**Your local development will work perfectly now!** 🎉

**Just restart the frontend dev server!** 🔄

