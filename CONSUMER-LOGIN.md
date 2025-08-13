# 🔐 Consumer Login Guide

## 🎯 **How to Login as a Consumer**

### **1. Access the Login Page**
- Open your browser and go to: `http://localhost:3000`
- You'll see the login form with two tabs: **Dealer/Admin** and **Consumer**

### **2. Select Consumer Mode**
- Click on the **"Consumer"** tab (it will turn green)
- The form will update to show consumer-specific instructions

### **3. Enter Consumer Phone Number**
- **Phone Number**: `7777777777`
- This is the demo consumer account
- Click **"Send OTP"**

### **4. Check Console for OTP**
- Open browser **Developer Tools** (F12)
- Go to **Console** tab
- You'll see: `Mock OTP for consumer 7777777777: 123456`
- Use this OTP code

### **5. Enter OTP and Login**
- **OTP**: Enter the 6-digit code from console
- Click **"Verify OTP"**
- You'll be logged in as a consumer!

## 🏠 **Consumer Dashboard Features**

### **📱 What You'll See:**
- **Brand**: "Ienerzy Consumer" in the navbar
- **Navigation**: Only "Dashboard" option (no dealer tools)
- **Personal Data**: Your batteries and EMI information only

### **🔋 Battery Management:**
- **View Battery Health**: Real-time status and health scores
- **Telemetry Data**: Voltage, current, state of charge, location
- **Status Updates**: Active, inactive, or maintenance status

### **💰 EMI Management:**
- **Due Payments**: List of upcoming EMI payments
- **Payment History**: Track paid vs. pending EMIs
- **Pay EMI**: Mock payment processing (always successful)

### **📊 Real-time Updates:**
- **Live Telemetry**: Battery data updates every 5 seconds
- **Status Changes**: Real-time battery status updates
- **Payment Confirmations**: Immediate payment success feedback

## 🔧 **Technical Details**

### **Consumer Account:**
- **Phone**: `7777777777`
- **Name**: Consumer Demo
- **KYC Status**: Verified
- **Role**: consumer

### **Linked Batteries:**
- **BAT001**: Active battery (95% health)
- **BAT002**: Active battery (87% health)

### **Sample EMIs:**
- **Amount**: ₹4,167 per month
- **Duration**: 12 months
- **Status**: Pending (ready for payment)

## 🚀 **Demo Scenarios**

### **Scenario 1: Check Battery Health**
1. Login as consumer
2. View battery health scores
3. Click "View Details" on any battery
4. See real-time telemetry data

### **Scenario 2: Pay EMI**
1. View EMI due list
2. Click "Pay EMI" button
3. See payment confirmation
4. EMI status changes to "paid"

### **Scenario 3: Monitor Battery Status**
1. Watch battery telemetry updates
2. See voltage, current, and SOC changes
3. Monitor location coordinates
4. Check maintenance alerts

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **"Consumer not found" Error**
- Make sure you selected **Consumer** tab
- Use phone number: `7777777777`
- Check if database is properly seeded

#### **No Batteries Showing**
- Run database setup: `npm run setup-db`
- Check console for any errors
- Verify consumer is linked to batteries

#### **OTP Not Working**
- Check browser console for OTP code
- Make sure you're using the latest OTP
- OTP expires after 5 minutes

### **Database Reset:**
```bash
# If you need to reset the database
npm run setup-db
```

## 🎉 **What This Demonstrates**

### **✅ Consumer Experience:**
- **Personal Dashboard**: Only see your own data
- **Battery Monitoring**: Real-time health tracking
- **EMI Management**: Payment processing workflow
- **Mobile-First**: Responsive design for all devices

### **✅ Security Features:**
- **Role-Based Access**: Consumers can't access dealer tools
- **Data Isolation**: Only see your own batteries/EMIs
- **JWT Authentication**: Secure session management
- **OTP Verification**: Two-factor authentication

### **✅ Real-World Features:**
- **Mock Telemetry**: Simulated BMS data
- **Payment Processing**: EMI payment workflow
- **Status Tracking**: Battery and payment status
- **Responsive UI**: Works on all screen sizes

---

## 🎯 **Perfect for Demos!**

This consumer login system demonstrates:
- **User Authentication**: Secure login with OTP
- **Role-Based Access**: Different views for different users
- **Real-Time Data**: Live battery monitoring
- **Payment Workflows**: EMI management system
- **Mobile Experience**: Responsive design

**Great for hackathon presentations and user demos!** 🚀📱 