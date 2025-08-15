# 📚 **Ienerzy API Documentation Guide**

## 🚀 **Quick Start**

### **1. API Documentation**
- **Main Docs**: `API_DOCUMENTATION.md` - Comprehensive endpoint documentation
- **Quick Reference**: `API_DOCS.md` - Essential endpoints and examples
- **Postman Collection**: `Ienerzy_API.postman_collection.json` - Ready-to-use API tests

### **2. Import Postman Collection**
1. Open Postman
2. Click "Import" button
3. Select `Ienerzy_API.postman_collection.json`
4. Set environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `auth_token`: Your JWT token after login

### **3. Test Authentication**
1. Run "Login" request with your phone number
2. Check SMS for OTP
3. Run "Verify OTP" request
4. Copy the returned token
5. Set `auth_token` variable in Postman

## 🔧 **Testing the Battery Status Issue**

### **Debug Endpoint**
Use the new test endpoint to directly test battery status updates:

```http
POST /api/batteries/BAT001/test-status
Body: { "status": "inactive" }
```

### **Enhanced Logging**
Both client and server now have detailed logging:
- **Client**: Check browser console for request details
- **Server**: Check server console for processing details

## 📋 **API Categories**

### **✅ Fully Implemented**
- **Authentication** - Login, OTP, JWT tokens
- **Battery Management** - CRUD, status control, health reports
- **Consumer Management** - KYC, documents, profiles
- **Finance Management** - Applications, approvals, overdue handling
- **Service Management** - Tickets, technicians, auto-assignment
- **Analytics** - Dashboard, reports, metrics

### **🔄 Mock Implementations**
- **Real-time Streaming** - WebSocket endpoints (ready for Socket.io)
- **Document Storage** - Mock endpoints (ready for cloud storage)
- **NBFC Integration** - Mock responses (ready for real NBFC APIs)

## 🧪 **Testing Workflow**

### **1. Start Server**
```bash
cd server
npm start
```

### **2. Test Authentication**
```bash
# Get OTP
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "userType": "dealer"}'

# Verify OTP (check SMS for actual OTP)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

### **3. Test Battery Status Change**
```bash
# Use the token from step 2
curl -X POST http://localhost:5000/api/batteries/BAT001/control \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"action": "inactive"}'
```

### **4. Test Direct Status Update**
```bash
curl -X POST http://localhost:5000/api/batteries/BAT001/test-status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

## 🔍 **Debugging the Battery Issue**

### **Check Server Logs**
The enhanced logging will show:
- ✅ Request received with action value
- ✅ Action normalization process
- ✅ Current battery state
- ✅ Database update attempt
- ✅ Success/failure result

### **Check Client Logs**
Browser console will show:
- ✅ Request payload being sent
- ✅ Response received
- ✅ Any error details

### **Common Issues**
1. **Token expired** - Re-authenticate
2. **Permission denied** - Check user role
3. **Battery not found** - Verify serial number
4. **Database constraint** - Check status values

## 📖 **Documentation Files**

| File | Purpose | Use Case |
|------|---------|----------|
| `API_DOCUMENTATION.md` | Complete reference | Developers, integration |
| `API_DOCS.md` | Quick reference | Testing, debugging |
| `Ienerzy_API.postman_collection.json` | Postman collection | API testing, development |
| `API_ENDPOINTS_SUMMARY.md` | Implementation status | Project overview |

## 🆘 **Need Help?**

### **Check These First**
1. **Server running?** - `http://localhost:5000/api/batteries/test`
2. **Token valid?** - `GET /api/auth/me`
3. **Database connected?** - Check server console
4. **Permissions correct?** - Verify user role

### **Debug Steps**
1. Use the test endpoints
2. Check enhanced logging
3. Verify database constraints
4. Test with Postman collection

---

