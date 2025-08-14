# 🚀 Render Deployment Guide

## 📋 **Prerequisites**

- [ ] Render account (free tier available)
- [ ] GitHub repository with your code
- [ ] Twilio account (for SMS features)
- [ ] Gmail account (for email features)

## 🔧 **Step 1: Prepare Your Code**

### **1.1 Push to GitHub**
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### **1.2 Verify File Structure**
```
your-repo/
├── server/
│   ├── index.js
│   ├── package.json
│   ├── routes/
│   ├── services/
│   └── database/
├── client/
│   └── src/
├── render.yaml
└── README.md
```

## 🌐 **Step 2: Deploy on Render**

### **2.1 Create Render Account**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Verify your email

### **2.2 Deploy Backend**
1. **Click "New +" → "Web Service"**
2. **Connect Repository:**
   - Select your GitHub repo
   - Choose the main branch
3. **Configure Service:**
   - **Name:** `ienerzy-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Plan:** `Free`

### **2.3 Create Database**
1. **Click "New +" → "PostgreSQL"**
2. **Configure Database:**
   - **Name:** `ienerzy-db`
   - **Database:** `ienerzy_prod`
   - **User:** `ienerzy_user`
   - **Plan:** `Free`

## ⚙️ **Step 3: Configure Environment Variables**

### **3.1 Database Variables (Auto-sync)**
Render will automatically sync these from your database:
- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

### **3.2 Manual Environment Variables**
Set these in your Render service dashboard:

#### **JWT Secret (Auto-generated)**
- `JWT_SECRET` - Render will generate this automatically

#### **Twilio Configuration**
- `TWILIO_ACCOUNT_SID` - From your Twilio dashboard
- `TWILIO_AUTH_TOKEN` - From your Twilio dashboard
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number

#### **Gmail OAuth Configuration**
- `GMAIL_CLIENT_ID` - From Google Cloud Console
- `GMAIL_CLIENT_SECRET` - From Google Cloud Console
- `GMAIL_REDIRECT_URI` - `https://your-app-name.onrender.com/api/email/oauth/callback`
- `GMAIL_REFRESH_TOKEN` - Generated via OAuth flow
- `GMAIL_USER` - Your Gmail address
- `GMAIL_FROM_NAME` - `Ienerzy System`

#### **Application Configuration**
- `NODE_ENV` - `production`
- `PORT` - `10000`

## 🔗 **Step 4: Update Frontend Configuration**

### **4.1 Update API Base URL**
In your React app, update the API base URL:

```javascript
// client/src/App.js
axios.defaults.baseURL = 'https://your-app-name.onrender.com/api';
```

### **4.2 Build and Deploy Frontend**
```bash
cd client
npm run build
```

You can deploy the frontend to:
- **Netlify** (free tier)
- **Vercel** (free tier)
- **GitHub Pages** (free)

## 📱 **Step 5: Test Your Deployment**

### **5.1 Health Check**
Visit: `https://your-app-name.onrender.com/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### **5.2 Test API Endpoints**
```bash
# Test authentication
curl -X POST https://your-app-name.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9340968955","userType":"consumer"}'
```

## 🚨 **Free Tier Limitations**

### **Render Free Tier:**
- **Backend:** 750 hours/month (31 days)
- **Database:** 90 days free trial
- **Sleep after 15 minutes of inactivity**
- **Auto-wake on first request**

### **Workarounds:**
1. **Keep Alive:** Use a service like UptimeRobot
2. **Database:** Consider migrating to Supabase (free tier)
3. **Monitoring:** Set up alerts for downtime

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. Build Failures**
```bash
# Check build logs in Render dashboard
# Verify package.json has correct scripts
```

#### **2. Database Connection Issues**
```bash
# Verify environment variables are set
# Check database is running
# Test connection locally first
```

#### **3. CORS Issues**
```bash
# Verify CORS configuration in server/index.js
# Check frontend URL is allowed
```

#### **4. Environment Variables**
```bash
# Verify all required variables are set
# Check for typos in variable names
# Restart service after changing variables
```

## 📊 **Monitoring & Maintenance**

### **1. Render Dashboard**
- Monitor service health
- Check logs for errors
- Monitor resource usage

### **2. Database Management**
- Regular backups
- Monitor connection limits
- Check query performance

### **3. Performance Optimization**
- Enable compression
- Optimize database queries
- Use caching where possible

## 🎯 **Next Steps**

### **1. Custom Domain**
- Add custom domain in Render dashboard
- Update DNS settings
- Configure SSL certificate

### **2. Scaling**
- Upgrade to paid plans when needed
- Add load balancing
- Implement caching strategies

### **3. CI/CD**
- Set up automatic deployments
- Add testing pipeline
- Configure staging environment

## 🎉 **Success!**

Your Ienerzy backend is now deployed on Render's free tier!

**Backend URL:** `https://your-app-name.onrender.com`
**Health Check:** `https://your-app-name.onrender.com/health`
**API Base:** `https://your-app-name.onrender.com/api`

---

## 💡 **Pro Tips**

1. **Keep it Simple:** Start with essential features
2. **Monitor Usage:** Stay within free tier limits
3. **Plan Ahead:** Consider paid plans for production
4. **Backup Data:** Regular database backups
5. **Test Everything:** Verify all features work in production

**Happy Deploying! 🚀** 