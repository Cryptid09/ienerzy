# 🔋 Ienerzy Battery Management System

A complete, production-ready battery management system built for the energy sector. Features real-time monitoring, consumer management, finance workflows, and service ticketing.

## 🚀 **Live Demo**

- **Backend API:** [Deploy on Render](https://render.com) (Free Tier)
- **Frontend:** [Deploy on Netlify/Vercel](https://netlify.com) (Free Tier)

## 🛠️ **Local Development**

For local development setup, see [DEVELOPMENT-SETUP.md](DEVELOPMENT-SETUP.md)

## ✨ **Features**

### 🔐 **Authentication & Security**
- **Multi-role Access:** Consumer, Dealer, Admin, NBFC
- **OTP-based Login:** SMS delivery via Twilio
- **Password Login:** For staff users
- **JWT Tokens:** Secure session management
- **Role-based Permissions:** Granular access control

### 🔋 **Battery Management**
- **Lifecycle Tracking:** Registration to decommissioning
- **Real-time Monitoring:** Health scores, status updates
- **Telemetry Data:** Voltage, current, temperature
- **Status Control:** Active, inactive, maintenance modes

### 👥 **Consumer Management**
- **KYC Processing:** Document verification workflow
- **Battery Assignment:** Link consumers to batteries
- **EMI Tracking:** Payment schedules and reminders
- **Service History:** Complete maintenance records

### 💰 **Finance Management**
- **Loan Applications:** NBFC integration simulation
- **EMI Scheduling:** Automated payment plans
- **Payment Processing:** Mock payment gateway
- **Financial Reports:** Application status tracking

### 🎫 **Service Management**
- **Ticket Creation:** Issue tracking system
- **Technician Assignment:** Auto-assignment logic
- **Status Updates:** Real-time progress tracking
- **Service History:** Complete maintenance logs

### 📱 **Communication**
- **SMS Notifications:** Twilio integration
- **Email Alerts:** Gmail OAuth 2.0
- **OTP Delivery:** Secure verification codes
- **Status Updates:** Real-time notifications

## 🛠️ **Tech Stack**

### **Backend**
- **Node.js** + **Express.js** - Server framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication & authorization
- **bcryptjs** - Password hashing
- **Twilio** - SMS services
- **Nodemailer** - Email services

### **Frontend**
- **React** - UI framework
- **Tailwind CSS** - Styling system
- **Axios** - HTTP client
- **React Router** - Navigation

### **Infrastructure**
- **Render** - Backend hosting (Free tier)
- **PostgreSQL** - Database hosting
- **GitHub** - Version control

## 🚀 **Quick Start**

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/ienerzy.git
cd ienerzy
```

### **2. Install Dependencies**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### **3. Environment Setup**
```bash
# Copy environment template
cp server/env.example server/.env

# Edit with your credentials
nano server/.env
```

### **4. Start Development**
```bash
# Backend (Terminal 1)
cd server
npm run dev

# Frontend (Terminal 2)
cd client
npm start
```

## 🌐 **Deployment**

### **Render (Backend)**
1. **Push to GitHub**
2. **Connect to Render**
3. **Set environment variables**
4. **Deploy automatically**

### **Netlify/Vercel (Frontend)**
1. **Build the app:** `npm run build`
2. **Deploy to platform**
3. **Update API base URL**

## 📱 **Demo Credentials**

### **Consumer Login**
- **Phone:** `9340968955`
- **Type:** `consumer`

### **Dealer Login**
- **Phone:** `8888888888`
- **Type:** `dealer`

### **Admin Login**
- **Phone:** `9999999999`
- **Type:** `admin`

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/login` - OTP login
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/signup` - Staff registration
- `POST /api/auth/signup-consumer` - Consumer registration

### **Batteries**
- `GET /api/batteries` - List batteries
- `POST /api/batteries` - Add battery
- `PUT /api/batteries/:id` - Update battery
- `DELETE /api/batteries/:id` - Delete battery

### **Consumers**
- `GET /api/consumers` - List consumers
- `POST /api/consumers` - Add consumer
- `PUT /api/consumers/:id` - Update consumer
- `DELETE /api/consumers/:id` - Delete consumer

### **Finance**
- `GET /api/finance/applications` - List applications
- `POST /api/finance/applications` - Create application
- `GET /api/finance/emi-due` - Get EMI due

### **Service**
- `GET /api/service/tickets` - List tickets
- `POST /api/service/tickets` - Create ticket
- `PUT /api/service/tickets/:id/status` - Update status

## 📊 **Database Schema**

### **Core Tables**
- **users** - Staff accounts (dealer, admin, NBFC)
- **consumers** - Customer information
- **batteries** - Battery inventory
- **finance_applications** - Loan applications
- **emi_schedules** - Payment schedules
- **service_tickets** - Maintenance tickets

### **Relationships**
- Consumers belong to Dealers
- Batteries are owned by Consumers
- Finance applications link Consumers and Batteries
- Service tickets are linked to Batteries

## 🔒 **Security Features**

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Role-based Access** - Granular permissions
- **Input Validation** - Request sanitization
- **CORS Protection** - Cross-origin security

## 📱 **Responsive Design**

- **Mobile First** - Optimized for mobile devices
- **Tablet Support** - Responsive layouts
- **Desktop Experience** - Full-featured interface
- **Touch Friendly** - Mobile-optimized interactions

## 🚨 **Free Tier Limitations**

### **Render Free Tier**
- **Backend:** 750 hours/month
- **Database:** 90 days trial
- **Sleep after 15 minutes**
- **Auto-wake on request**

### **Workarounds**
- Use UptimeRobot for keep-alive
- Consider Supabase for database
- Monitor usage closely

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation:** [Deployment Guide](DEPLOYMENT-GUIDE.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/ienerzy/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/ienerzy/discussions)

---

## 🎯 **Business Value**

- **Complete Solution:** End-to-end battery management
- **Scalable Architecture:** Ready for production use
- **Modern Technology:** Built with industry standards
- **Cost Effective:** Free tier hosting available
- **Professional Grade:** Production-ready codebase

**Built for the future of energy management! 🔋⚡** 