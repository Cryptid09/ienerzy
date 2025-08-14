# Gmail SMTP Email Integration Setup Guide

This guide will help you set up Gmail SMTP for email notifications in the Ienerzy application, complementing the existing Twilio SMS functionality.

## 🚀 Quick Start

### 1. Enable 2-Factor Authentication on Gmail
- Go to your Google Account settings
- Navigate to "Security"
- Enable "2-Step Verification" if not already enabled

### 2. Generate App Password
- In Google Account settings, go to "Security"
- Find "App passwords" (under 2-Step Verification)
- Select "Mail" as the app and "Other" as the device
- Click "Generate"
- Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### 3. Configure Environment Variables
Add these to your `server/.env` file:

```bash
# Existing variables...
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ienerzy_mvp
DB_PASSWORD=password
DB_PORT=5432
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
NODE_ENV=development

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Gmail SMTP Configuration
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
GMAIL_FROM_NAME=Ienerzy Notifications
```

**⚠️ Important:** 
- Use your actual Gmail address
- Use the 16-character app password (not your regular Gmail password)
- The app password format is: `abcd efgh ijkl mnop` (remove spaces)

### 4. Install Dependencies
```bash
cd server
npm install
```

### 5. Restart Your Server
```bash
npm run dev
```

## 📧 Email Features Available

### **EMI Reminders**
- Beautiful HTML emails with payment details
- Due date highlighting
- Amount and description information
- Professional styling and branding

### **Service Ticket Updates**
- Real-time status change notifications
- Priority level indicators
- Issue category and description
- Assignment and location details

### **Finance Notifications**
- **Approval emails**: Congratulations with application details
- **Rejection emails**: Professional feedback with next steps
- Application ID and amount information
- Contact information for support

### **Battery Status Updates**
- Real-time battery monitoring alerts
- Voltage and temperature data
- Status change notifications
- Professional battery health reporting

### **OTP Verification**
- Secure verification codes
- Time-limited validity
- Professional authentication emails
- Security warnings and instructions

## 🔧 Testing the Integration

### 1. Check Service Status
- Go to the Messaging page in your app
- Click "Check Service Status"
- You should see both SMS and Email services available

### 2. Send Test Email
Use the API endpoint:
```bash
POST /api/email/send-test
{
  "email": "your-email@example.com"
}
```

### 3. Test Different Email Types
- **EMI Reminder**: `/api/email/emi-reminder`
- **Ticket Update**: `/api/email/ticket-update`
- **Finance Approval**: `/api/email/finance-approval`
- **Finance Rejection**: `/api/email/finance-rejection`
- **Custom Email**: `/api/email/send-custom`

## 🎨 Email Templates

All emails include:
- **Professional HTML styling**
- **Responsive design**
- **Branded headers**
- **Clear content structure**
- **Professional footers**
- **Plain text alternatives**

### Sample EMI Reminder Email:
```
📧 EMI Payment Reminder

Hello John Doe,

This is a friendly reminder that your EMI payment is due soon.

Due Date: 2024-02-15
Amount Due: ₹5000
Description: Monthly EMI

Please ensure timely payment to avoid any late fees or service interruptions.

Best regards,
Team Ienerzy
```

## 🔒 Security Features

### **App Password Security**
- Separate from your main Gmail password
- Can be revoked individually
- No access to your main account
- Specific to this application only

### **Environment Variable Protection**
- Credentials stored in `.env` file
- Never committed to version control
- Server-side only access
- Secure credential management

### **Rate Limiting**
- Gmail's built-in rate limiting
- Prevents spam and abuse
- Professional email delivery
- High deliverability rates

## 🚨 Troubleshooting

### Common Issues

#### 1. "Authentication failed"
- Verify 2-Factor Authentication is enabled
- Check app password is correct (16 characters)
- Ensure no extra spaces in app password
- Verify Gmail address is correct

#### 2. "App password not working"
- Generate a new app password
- Wait 5-10 minutes for activation
- Check if 2FA is still enabled
- Verify account security settings

#### 3. "Email not sending"
- Check Gmail account status
- Verify app password hasn't expired
- Check server logs for errors
- Ensure environment variables are loaded

#### 4. "Emails going to spam"
- Use professional from name
- Avoid excessive sending
- Include proper headers
- Use consistent sending patterns

### Debug Mode
Enable detailed logging:
```bash
DEBUG=nodemailer:*
```

## 💰 Gmail Limitations

### **Free Tier Includes**
- ✅ 500 emails per day
- ✅ Professional SMTP access
- ✅ High deliverability
- ✅ Spam protection
- ✅ Mobile app support

### **What's Not Included**
- ❌ Unlimited sending
- ❌ Advanced analytics
- ❌ Custom domains
- ❌ Priority support

### **Upgrading**
For high-volume needs:
1. **Google Workspace**: Professional email hosting
2. **SendGrid**: Dedicated email service
3. **Mailgun**: Transactional email service
4. **Amazon SES**: AWS email service

## 📚 API Reference

### **Email Service Endpoints**

#### GET `/api/email/status`
Get email service status and configuration

#### POST `/api/email/send-test`
Send test email to verify service

#### POST `/api/email/emi-reminder`
Send EMI payment reminder email
```json
{
  "email": "consumer@example.com",
  "emiData": {
    "consumerName": "John Doe",
    "dueDate": "2024-02-15",
    "amount": "5000",
    "description": "Monthly EMI"
  }
}
```

#### POST `/api/email/ticket-update`
Send service ticket status update
```json
{
  "email": "consumer@example.com",
  "ticketData": {
    "id": "TKT001",
    "status": "In Progress",
    "priority": "High",
    "issueCategory": "Battery",
    "description": "Battery malfunction",
    "consumerName": "John Doe",
    "assignedTo": "Tech Support",
    "location": "Mumbai"
  }
}
```

#### POST `/api/email/finance-approval`
Send finance application approval
```json
{
  "email": "consumer@example.com",
  "financeData": {
    "id": "FIN001",
    "consumerName": "John Doe",
    "amount": "50000",
    "batteryId": "BAT001",
    "approvalDate": "2024-01-15"
  }
}
```

#### POST `/api/email/finance-rejection`
Send finance application rejection
```json
{
  "email": "consumer@example.com",
  "financeData": {
    "id": "FIN001",
    "consumerName": "John Doe",
    "amount": "50000",
    "batteryId": "BAT001"
  }
}
```

#### POST `/api/email/send-custom`
Send custom email with your content
```json
{
  "email": "recipient@example.com",
  "subject": "Custom Subject",
  "message": "Your custom message content here"
}
```

## 🔄 Unified Notifications

The system now supports **dual-channel notifications**:

### **SMS + Email**
- Send to both channels simultaneously
- Fallback if one service fails
- Consistent messaging across platforms
- Professional communication

### **Smart Routing**
- SMS for urgent notifications
- Email for detailed information
- Automatic fallback handling
- Service availability checking

## 📱 Integration with Existing Features

### **Consumer Management**
- Add email addresses to consumer profiles
- Send notifications via preferred channels
- Track notification delivery status
- Professional communication history

### **Finance Module**
- Automated EMI reminders
- Application status updates
- Payment confirmations
- Financial notifications

### **Service Tickets**
- Real-time status updates
- Assignment notifications
- Resolution confirmations
- Support communication

### **Battery Monitoring**
- Health status alerts
- Maintenance reminders
- Performance updates
- Safety notifications

## 🎯 Best Practices

### **Email Content**
- Keep subject lines clear and concise
- Use professional language
- Include relevant information
- Provide clear next steps

### **Sending Frequency**
- Don't overwhelm recipients
- Space out notifications
- Use appropriate urgency levels
- Respect user preferences

### **Monitoring**
- Track delivery rates
- Monitor bounce rates
- Check spam folder placement
- Analyze user engagement

## 🚀 Next Steps

After successful setup:
1. **Test all email types**
2. **Integrate with existing workflows**
3. **Set up automated notifications**
4. **Monitor delivery and engagement**
5. **Customize email templates**
6. **Implement user preferences**

---

## 🎉 **Complete Notification System**

You now have a **professional dual-channel notification system**:

- **📱 SMS via Twilio** - Quick, reliable, mobile-first
- **📧 Email via Gmail SMTP** - Rich, detailed, professional
- **🔄 Unified Service** - Smart routing and fallbacks
- **🎨 Beautiful Templates** - Professional branding and styling
- **🔒 Secure & Reliable** - Enterprise-grade delivery

**Happy Notifying! 📧✨** 