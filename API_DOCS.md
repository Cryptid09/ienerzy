# 🚀 Ienerzy API Documentation

## 🔐 **Authentication**
All endpoints require JWT token in header: `Authorization: Bearer <token>`

### **Login Flow**
```http
POST /api/auth/login
Body: { "phone": "+919876543210", "userType": "dealer" }

POST /api/auth/verify-otp  
Body: { "phone": "+919876543210", "otp": "123456" }
```

---

## 🔋 **Battery Management**

### **List Batteries**
```http
GET /api/batteries
Response: Array of battery objects with status, health_score, owner_id
```

### **Add Battery**
```http
POST /api/batteries
Body: { "serial_number": "BAT001", "health_score": 100 }
```

### **Control Battery Status**
```http
POST /api/batteries/{serial}/control
Body: { "action": "inactive" } // or "active", "maintenance"
```

### **Assign Battery**
```http
PUT /api/batteries/{serial}/assign
Body: { "consumer_id": 1 }
```

### **Health Report**
```http
GET /api/batteries/health-report
Response: Fleet health analytics and metrics
```

---

## 👥 **Consumer Management**

### **List Consumers**
```http
GET /api/consumers
Response: Array of consumer objects with KYC status
```

### **Create Consumer**
```http
POST /api/consumers
Body: { "name": "Ram Kumar", "phone": "+919876543210" }
```

### **Update KYC**
```http
PUT /api/consumers/{id}/kyc
Body: { "kyc_status": "verified", "pan": "ABCDE1234F" }
```

### **Finance Details**
```http
GET /api/consumers/{id}/finance
Response: NBFC applications and EMI schedules
```

### **Upload Documents**
```http
POST /api/consumers/{id}/documents
Body: { "document_type": "pan_card", "document_url": "https://..." }
```

---

## 💰 **Finance Management**

### **Submit Application**
```http
POST /api/finance/applications
Body: { "consumer_id": 1, "battery_id": 1, "amount": 45000, "tenure_months": 24 }
```

### **Approve Application**
```http
PUT /api/finance/applications/{id}/approve
Body: { "status": "approved", "approved_amount": 45000, "interest_rate": 12.5 }
```

### **Overdue Accounts**
```http
GET /api/finance/overdue
Response: List of overdue EMIs with consumer details
```

### **Auto-disable Batteries**
```http
POST /api/finance/auto-disable
Body: { "overdue_days_threshold": 7 }
```

---

## 🏦 **NBFC Integration**

### **Submit to NBFC**
```http
POST /api/nbfc/submit-application
Body: { "consumer_id": 1, "battery_id": 1, "amount": 45000, "tenure_months": 24 }
```

### **Webhook Handler**
```http
POST /api/nbfc/webhook-status
Body: { "applicationId": 1, "status": "approved", "sanctionedAmount": 45000 }
```

### **Portfolio Analytics**
```http
GET /api/nbfc/portfolio
Response: Application counts, disbursement trends, portfolio health
```

---

## 🔧 **Service Management**

### **Create Ticket**
```http
POST /api/service/tickets
Body: { "battery_id": 1, "issue_category": "performance", "description": "..." }
```

### **Active Tickets**
```http
GET /api/service/tickets/active
Response: Open, assigned, and in-progress tickets
```

### **Assign Technician**
```http
PUT /api/service/tickets/{id}/assign
Body: { "technician_id": 1, "priority": "high" }
```

### **Auto-assign**
```http
POST /api/service/auto-assign
Body: { "ticket_id": 1, "location": "Bangalore", "skill_required": "battery_maintenance" }
```

### **Available Technicians**
```http
GET /api/service/technicians/available?location=Bangalore&skill_required=battery_maintenance
Response: Technicians with availability scores
```

---

## 📈 **Analytics**

### **Dealer Dashboard**
```http
GET /api/analytics/dealer-dashboard
Response: Consumer counts, battery metrics, finance summary, service metrics
```

### **Collection Report**
```http
GET /api/analytics/collection-report?start_date=2024-01-01&end_date=2024-01-31
Response: Daily collections, overdue analysis, collection efficiency
```

---

## 📧 **Communication**

### **Send SMS**
```http
POST /api/messaging/send-sms
Body: { "to": "+919876543210", "message": "..." }
```

### **Send OTP**
```http
POST /api/messaging/send-otp
Body: { "to": "+919876543210", "otp": "123456" }
```

---

## 🚨 **Error Handling**

### **Standard Error Response**
```json
{
  "error": "Error message",
  "details": "Additional details",
  "code": "ERROR_CODE"
}
```

### **HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔧 **Testing**

### **Test Endpoints**
- `GET /api/batteries/test` - Test batteries route
- `POST /api/batteries/{serial}/test-status` - Test direct status update

### **Mock Data**
All endpoints return realistic data for development. Database constraints enforced.

---

## 📚 **Quick Start**

### **1. Get Token**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "userType": "dealer"}'
```

### **2. Use Token**
```bash
curl -X GET http://localhost:5000/api/batteries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **3. Change Battery Status**
```bash
curl -X POST http://localhost:5000/api/batteries/BAT001/control \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"action": "inactive"}'
```

---

*API Version: v1 | Last Updated: January 2024* 