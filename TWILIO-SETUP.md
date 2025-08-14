# Twilio SMS Integration Setup Guide

This guide will help you set up Twilio's free tier SMS messaging service for the Ienerzy application.

## 🚀 Quick Start

### 1. Sign Up for Twilio
- Go to [https://www.twilio.com](https://www.twilio.com)
- Click "Sign up for free"
- Complete the registration process
- Verify your email address

### 2. Get Your Credentials
After signing up, you'll need these from your Twilio Console:

1. **Account SID** - Found on the main dashboard
2. **Auth Token** - Click "Show" to reveal (keep this secret!)
3. **Phone Number** - Get a free phone number for SMS

### 3. Get a Phone Number
- In Twilio Console, go to "Phone Numbers" → "Manage" → "Active numbers"
- Click "Get a trial number"
- Choose a number that supports SMS
- Note: Free tier numbers are marked as "Trial"

### 4. Configure Environment Variables
Create a `.env` file in your `server/` directory with:

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

# Add these new Twilio variables:
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**⚠️ Important:** Replace the placeholder values with your actual Twilio credentials!

### 5. Install Dependencies
```bash
cd server
npm install
```

### 6. Restart Your Server
```bash
npm run dev
```

## 📱 Testing the Integration

### 1. Access the Messaging Test Page
- Login as a dealer/admin user
- Navigate to "Messaging" in the navigation menu
- You'll see a comprehensive testing interface

### 2. Check Service Status
- Click "Check Service Status" to verify Twilio is properly configured
- You should see:
  - ✅ Available: Yes
  - ✅ Provider: Twilio
  - ✅ Phone Number: Your Twilio number
  - ✅ Initialized: Yes

### 3. Test with Your Phone Number
**⚠️ Free Tier Limitation:** Initially, you can only send SMS to verified phone numbers.

To verify your phone number:
1. In Twilio Console, go to "Phone Numbers" → "Manage" → "Verified Caller IDs"
2. Click "Add a new Caller ID"
3. Enter your phone number
4. Twilio will send you a verification code
5. Enter the code to verify

### 4. Send Test Messages
Use the test interface to try:
- **Test SMS**: Basic functionality test
- **Custom SMS**: Send any message you want
- **OTP SMS**: Simulate OTP verification
- **Battery Status**: Battery monitoring notifications
- **Service Notifications**: Service ticket updates
- **Payment Reminders**: Financial notifications

## 🔧 Troubleshooting

### Common Issues

#### 1. "Twilio service not initialized"
- Check your `.env` file has all required variables
- Ensure no typos in variable names
- Restart your server after making changes

#### 2. "Authentication failed"
- Verify your Account SID and Auth Token
- Check for extra spaces or characters
- Ensure you're using the correct credentials

#### 3. "Phone number not verified"
- Free tier requires phone number verification
- Add your number in Twilio Console → Verified Caller IDs
- Wait for verification SMS and enter the code

#### 4. "SMS sending failed"
- Check your Twilio account balance
- Verify the recipient phone number format
- Ensure your Twilio number supports SMS

### Debug Mode
Enable detailed logging by adding to your `.env`:
```bash
DEBUG=twilio:*
```

## 💰 Free Tier Limitations

### What's Included
- ✅ 1 free phone number
- ✅ $15-20 credit for testing
- ✅ SMS to verified numbers
- ✅ Basic API access

### What's Not Included
- ❌ SMS to unverified numbers (without verification)
- ❌ Advanced features (MMS, voice, etc.)
- ❌ High-volume messaging

### Upgrading
When you're ready to go live:
1. Upgrade to a paid account
2. Remove phone number verification requirements
3. Get dedicated phone numbers
4. Access advanced features

## 📚 API Endpoints

The integration provides these endpoints:

### GET `/api/messaging/status`
Check messaging service status

### POST `/api/messaging/send-sms`
Send custom SMS message
```json
{
  "phoneNumber": "+919876543210",
  "message": "Your custom message here"
}
```

### POST `/api/messaging/send-otp`
Send OTP verification SMS
```json
{
  "phoneNumber": "+919876543210",
  "otp": "123456"
}
```

### POST `/api/messaging/battery-status`
Send battery status notification
```json
{
  "phoneNumber": "+919876543210",
  "batteryData": {
    "id": "BAT001",
    "status": "Normal",
    "voltage": "48.5",
    "temperature": "25"
  }
}
```

### POST `/api/messaging/service-notification`
Send service ticket notification
```json
{
  "phoneNumber": "+919876543210",
  "ticketData": {
    "id": "TKT001",
    "status": "Open",
    "priority": "High",
    "description": "Battery malfunction reported"
  }
}
```

### POST `/api/messaging/payment-reminder`
Send payment reminder
```json
{
  "phoneNumber": "+919876543210",
  "paymentData": {
    "amount": "5000",
    "description": "Monthly EMI",
    "dueDate": "2024-02-15"
  }
}
```

### POST `/api/messaging/test`
Send test SMS (for development)
```json
{
  "phoneNumber": "+919876543210"
}
```

## 🔒 Security Notes

1. **Never commit your `.env` file** to version control
2. **Keep your Auth Token secret** - it's like a password
3. **Use environment variables** for all sensitive data
4. **Monitor your Twilio usage** to avoid unexpected charges

## 📞 Support

- **Twilio Documentation**: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- **Twilio Support**: Available in your Console
- **Community**: [https://www.twilio.com/community](https://www.twilio.com/community)

## 🎯 Next Steps

After successful setup:
1. Test all message types
2. Integrate with your existing workflows
3. Set up automated notifications
4. Monitor message delivery
5. Consider upgrading when going live

---

**Happy Messaging! 📱✨** 