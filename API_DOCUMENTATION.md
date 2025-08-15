# 🚀 Ienerzy Battery Management System - API Documentation

## 📋 **Table of Contents**
- [Authentication](#authentication)
- [Battery Management](#battery-management)
- [Consumer Management](#consumer-management)
- [Finance Management](#finance-management)
- [NBFC Integration](#nbfc-integration)
- [Service Management](#service-management)
- [Analytics & Reporting](#analytics--reporting)
- [Communication Services](#communication-services)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🔐 **Authentication**

All API endpoints require authentication via JWT tokens (except where noted).

### **Headers Required**
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### **Login Flow**
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "userType": "dealer" // or "consumer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "phone": "+919876543210",
    "role": "dealer"
  }
}
```

### **Verify OTP**
```http
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "phone": "+919876543210",
    "role": "dealer"
  }
}
```

---

## 🔋 **Battery Management**

### **List All Batteries**
```http
GET /api/batteries
```

**Query Parameters:**
- `status` (optional): Filter by status (active, inactive, maintenance)
- `dealer_id` (optional): Filter by dealer ID

**Response:**
```json
[
  {
    "id": 1,
    "serial_number": "BAT001",
    "status": "active",
    "health_score": 95,
    "owner_id": 1,
    "consumer_name": "Ram Kumar",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### **Get Battery Details**
```http
GET /api/batteries/{serial}
```

**Response:**
```json
{
  "battery": {
    "id": 1,
    "serial_number": "BAT001",
    "status": "active",
    "health_score": 95,
    "owner_id": 1,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "telemetry": {
    "voltage": "48.5",
    "current": "12.3",
    "soc": 85,
    "location": {
      "lat": "12.9716",
      "lng": "77.5946"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### **Add New Battery**
```http
POST /api/batteries
```

**Request Body:**
```json
{
  "serial_number": "BAT002",
  "health_score": 100
}
```

**Response:**
```json
{
  "id": 2,
  "serial_number": "BAT002",
  "status": "active",
  "health_score": 100,
  "owner_id": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **Control Battery Status**
```http
POST /api/batteries/{serial}/control
```

**Request Body:**
```json
{
  "action": "inactive" // or "active", "maintenance", "deactivate", "activate"
}
```

**Response:**
```json
{
  "id": 1,
  "serial_number": "BAT001",
  "status": "inactive",
  "health_score": 95,
  "owner_id": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **Assign Battery to Consumer**
```http
PUT /api/batteries/{serial}/assign
```

**Request Body:**
```json
{
  "consumer_id": 1
}
```

**Response:**
```json
{
  "id": 1,
  "serial_number": "BAT001",
  "status": "active",
  "health_score": 95,
  "owner_id": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **Get Battery Health Report**
```http
GET /api/batteries/health-report
```

**Response:**
```json
{
  "fleet_health": {
    "active": {
      "count": 45,
      "avg_health": "92.3",
      "min_health": 75,
      "max_health": 100
    },
    "inactive": {
      "count": 5,
      "avg_health": "45.2",
      "min_health": 20,
      "max_health": 70
    }
  },
  "total_batteries": 50,
  "overall_health_score": 87.6
}
```

---

## 👥 **Consumer Management**

### **List Consumers**
```http
GET /api/consumers
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Ram Kumar",
    "phone": "+919876543210",
    "pan": "ABCDE1234F",
    "aadhar": "123456789012",
    "kyc_status": "verified",
    "dealer_id": 1,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### **Create Consumer**
```http
POST /api/consumers
```

**Request Body:**
```json
{
  "name": "Ram Kumar",
  "phone": "+919876543210",
  "pan": "ABCDE1234F",
  "aadhar": "123456789012"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Ram Kumar",
  "phone": "+919876543210",
  "pan": "ABCDE1234F",
  "aadhar": "123456789012",
  "kyc_status": "pending",
  "dealer_id": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **Update KYC Status**
```http
PUT /api/consumers/{id}/kyc
```

**Request Body:**
```json
{
  "kyc_status": "verified",
  "pan": "ABCDE1234F",
  "aadhar": "123456789012"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Ram Kumar",
  "phone": "+919876543210",
  "pan": "ABCDE1234F",
  "aadhar": "123456789012",
  "kyc_status": "verified",
  "dealer_id": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **Get Consumer Finance Details**
```http
GET /api/consumers/{id}/finance
```

**Response:**
```json
{
  "applications": [
    {
      "id": 1,
      "amount": 45000,
      "tenure_months": 24,
      "status": "approved",
      "battery_serial": "BAT001"
    }
  ],
  "emi_schedules": [
    {
      "id": 1,
      "emi_number": 1,
      "due_date": "2024-02-15",
      "amount": "1875.00",
      "status": "pending"
    }
  ],
  "total_applications": 1,
  "total_emi_due": 1
}
```

### **Upload Consumer Documents**
```http
POST /api/consumers/{id}/documents
```

**Request Body:**
```json
{
  "document_type": "pan_card",
  "document_url": "https://storage.example.com/pan_card.jpg",
  "document_number": "ABCDE1234F"
}
```

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": 1234567890,
    "consumer_id": 1,
    "document_type": "pan_card",
    "document_url": "https://storage.example.com/pan_card.jpg",
    "document_number": "ABCDE1234F",
    "uploaded_at": "2024-01-15T10:30:00Z",
    "status": "pending_verification"
  },
  "note": "This is a mock implementation. In production, implement cloud storage integration."
}
```

### **Get Complete Consumer Profile**
```http
GET /api/consumers/{id}/profile
```

**Response:**
```json
{
  "consumer": {
    "id": 1,
    "name": "Ram Kumar",
    "phone": "+919876543210",
    "pan": "ABCDE1234F",
    "aadhar": "123456789012",
    "kyc_status": "verified",
    "dealer_id": 1,
    "dealer_name": "ABC Motors",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "batteries": [
    {
      "id": 1,
      "serial_number": "BAT001",
      "status": "active",
      "health_score": 95,
      "service_tickets_count": 2,
      "active_tickets_count": 0
    }
  ],
  "recent_tickets": [
    {
      "id": 1,
      "issue_category": "performance",
      "status": "resolved",
      "battery_serial": "BAT001",
      "created_at": "2024-01-10T10:30:00Z"
    }
  ],
  "summary": {
    "total_batteries": 1,
    "active_batteries": 1,
    "total_service_tickets": 2,
    "active_service_tickets": 0
  }
}
```

---

## 💰 **Finance Management**

### **Submit Finance Application**
```http
POST /api/finance/applications
```

**Request Body:**
```json
{
  "consumer_id": 1,
  "battery_id": 1,
  "amount": 45000,
  "tenure_months": 24,
  "interest_rate": 12.5
}
```

**Response:**
```json
{
  "id": 1,
  "consumer_id": 1,
  "battery_id": 1,
  "amount": 45000,
  "tenure_months": 24,
  "interest_rate": 12.5,
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **List Finance Applications**
```http
GET /api/finance/applications
```

**Response:**
```json
[
  {
    "id": 1,
    "consumer_id": 1,
    "battery_id": 1,
    "amount": 45000,
    "tenure_months": 24,
    "interest_rate": 12.5,
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### **Approve/Reject Application**
```http
PUT /api/finance/applications/{id}/approve
```

**Request Body:**
```json
{
  "status": "approved",
  "approved_amount": 45000,
  "interest_rate": 12.5,
  "tenure_months": 24
}
```

**Response:**
```json
{
  "id": 1,
  "consumer_id": 1,
  "battery_id": 1,
  "amount": 45000,
  "tenure_months": 24,
  "interest_rate": 12.5,
  "status": "approved",
  "approved_amount": 45000,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **Get Overdue Accounts**
```http
GET /api/finance/overdue
```

**Response:**
```json
{
  "overdue_accounts": [
    {
      "id": 1,
      "emi_number": 3,
      "due_date": "2024-01-01",
      "amount": "1875.00",
      "status": "pending",
      "loan_amount": 45000,
      "tenure_months": 24,
      "consumer_name": "Ram Kumar",
      "consumer_phone": "+919876543210",
      "battery_serial": "BAT001",
      "overdue_days": 14
    }
  ],
  "total_overdue": 1,
  "total_overdue_amount": 1875.00
}
```

### **Auto-disable Batteries for Overdue**
```http
POST /api/finance/auto-disable
```

**Request Body:**
```json
{
  "overdue_days_threshold": 7
}
```

**Response:**
```json
{
  "message": "Batteries disabled successfully",
  "disabled_count": 2,
  "disabled_batteries": ["BAT001", "BAT002"]
}
```

### **Get Collection Report**
```http
GET /api/finance/collection-report
```

**Query Parameters:**
- `start_date` (optional): Start date for report period
- `end_date` (optional): End date for report period

**Response:**
```json
{
  "collection_report": [
    {
      "collection_date": "2024-01-15",
      "collections_count": 25,
      "total_collected": 46875.00,
      "avg_collection": 1875.00
    }
  ],
  "summary": {
    "total_collections": 25,
    "total_amount_collected": 46875.00,
    "avg_daily_collection": 1875.00
  }
}
```

---

## 🏦 **NBFC Integration**

### **Submit Application to NBFC**
```http
POST /api/nbfc/submit-application
```

**Request Body:**
```json
{
  "consumer_id": 1,
  "battery_id": 1,
  "amount": 45000,
  "tenure_months": 24,
  "interest_rate": 12.5
}
```

**Response:**
```json
{
  "success": true,
  "application": {
    "id": 1,
    "consumer_id": 1,
    "battery_id": 1,
    "amount": 45000,
    "tenure_months": 24,
    "interest_rate": 12.5,
    "dealer_id": 1,
    "status": "submitted",
    "submitted_at": "2024-01-15T10:30:00Z"
  },
  "message": "Application submitted to NBFC successfully"
}
```

### **Handle NBFC Webhook**
```http
POST /api/nbfc/webhook-status
```

**Request Body:**
```json
{
  "applicationId": 1,
  "status": "approved",
  "sanctionedAmount": 45000,
  "interestRate": 12.5,
  "emiAmount": 1875,
  "disbursementDate": "2024-01-20"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "application": {
    "id": 1,
    "status": "approved",
    "sanctioned_amount": 45000,
    "interest_rate": 12.5,
    "emi_amount": 1875
  }
}
```

### **Get NBFC Portfolio**
```http
GET /api/nbfc/portfolio
```

**Response:**
```json
{
  "portfolio_summary": {
    "total_applications": 100,
    "approved_count": 85,
    "disbursed_count": 75,
    "rejected_count": 15,
    "total_disbursed": 3375000,
    "avg_interest_rate": 12.3
  },
  "monthly_trend": [
    {
      "month": "2024-01-01",
      "applications": 25,
      "amount_disbursed": 1125000
    }
  ],
  "portfolio_health": {
    "approval_rate": "85.0",
    "disbursement_rate": "75.0"
  }
}
```

### **Submit Collection Report**
```http
POST /api/nbfc/collection-report
```

**Request Body:**
```json
{
  "report_date": "2024-01-15",
  "collection_data": {
    "total_collections": 25,
    "amount_collected": 46875.00,
    "overdue_count": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collection report submitted successfully",
  "report": {
    "id": 1,
    "dealer_id": 1,
    "report_date": "2024-01-15",
    "collection_data": "{\"total_collections\":25,\"amount_collected\":46875.00,\"overdue_count\":3}",
    "nbfc_response": "{\"success\":true,\"report_id\":\"RPT1234567890\"}",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "nbfc_response": {
    "success": true,
    "report_id": "RPT1234567890",
    "status": "submitted",
    "message": "Collection report submitted successfully to NBFC"
  }
}
```

---

## 🔧 **Service Management**

### **Create Service Ticket**
```http
POST /api/service/tickets
```

**Request Body:**
```json
{
  "battery_id": 1,
  "issue_category": "performance",
  "description": "Battery not holding charge properly",
  "location": "Bangalore Central"
}
```

**Response:**
```json
{
  "ticket": {
    "id": 1,
    "battery_id": 1,
    "issue_category": "performance",
    "description": "Battery not holding charge properly",
    "assigned_to": 1,
    "status": "assigned",
    "location": "Bangalore Central",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "assigned_technician": {
    "id": 1,
    "name": "Tech One",
    "location": "Bangalore Central",
    "status": "available"
  }
}
```

### **List Service Tickets**
```http
GET /api/service/tickets
```

**Response:**
```json
[
  {
    "id": 1,
    "battery_id": 1,
    "issue_category": "performance",
    "description": "Battery not holding charge properly",
    "assigned_to": 1,
    "status": "assigned",
    "location": "Bangalore Central",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### **Get Active Tickets**
```http
GET /api/service/tickets/active
```

**Response:**
```json
{
  "active_tickets": [
    {
      "id": 1,
      "battery_id": 1,
      "issue_category": "performance",
      "description": "Battery not holding charge properly",
      "assigned_to": 1,
      "status": "assigned",
      "location": "Bangalore Central",
      "battery_serial": "BAT001",
      "consumer_name": "Ram Kumar",
      "consumer_phone": "+919876543210",
      "technician_name": "Tech One",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "summary": {
    "open": 0,
    "assigned": 1,
    "in_progress": 0
  }
}
```

### **Assign Ticket to Technician**
```http
PUT /api/service/tickets/{id}/assign
```

**Request Body:**
```json
{
  "technician_id": 2,
  "priority": "high"
}
```

**Response:**
```json
{
  "message": "Ticket assigned successfully",
  "ticket": {
    "id": 1,
    "battery_id": 1,
    "issue_category": "performance",
    "description": "Battery not holding charge properly",
    "assigned_to": 2,
    "status": "assigned",
    "priority": "high",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "assigned_technician": {
    "id": 2,
    "name": "Tech Two",
    "phone": "+919876543211",
    "role": "technician"
  }
}
```

### **Update Ticket Status**
```http
POST /api/service/tickets/{id}/update
```

**Request Body:**
```json
{
  "status": "in_progress",
  "description": "Diagnosing battery issue",
  "resolution_notes": "Found loose connection",
  "parts_used": "Connector kit",
  "labor_hours": 2
}
```

**Response:**
```json
{
  "message": "Ticket updated successfully",
  "ticket": {
    "id": 1,
    "battery_id": 1,
    "issue_category": "performance",
    "description": "Diagnosing battery issue",
    "assigned_to": 2,
    "status": "in_progress",
    "resolution_notes": "Found loose connection",
    "parts_used": "Connector kit",
    "labor_hours": 2,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### **Get Available Technicians**
```http
GET /api/service/technicians/available
```

**Query Parameters:**
- `location` (optional): Filter by location
- `skill_required` (optional): Filter by required skill

**Response:**
```json
{
  "available_technicians": [
    {
      "id": 1,
      "name": "Tech One",
      "location": "Bangalore Central",
      "status": "available",
      "skills": ["battery_maintenance", "electrical"],
      "rating": 4.5,
      "experience_years": 3,
      "current_load": 2,
      "availability_score": 78.5
    }
  ],
  "count": 1,
  "scoring_algorithm": "Based on location proximity, skills match, rating, experience, and current workload"
}
```

### **Auto-assign Ticket**
```http
POST /api/service/auto-assign
```

**Request Body:**
```json
{
  "ticket_id": 1,
  "location": "Bangalore Central",
  "priority": "medium",
  "skill_required": "battery_maintenance"
}
```

**Response:**
```json
{
  "message": "Ticket auto-assigned successfully",
  "ticket": {
    "id": 1,
    "battery_id": 1,
    "assigned_to": 1,
    "status": "assigned",
    "priority": "medium"
  },
  "assigned_technician": {
    "id": 1,
    "name": "Tech One",
    "availability_score": 78.5
  },
  "assignment_reason": "Selected based on highest score: 78.5",
  "other_candidates": [
    {
      "id": 2,
      "name": "Tech Two",
      "score": 72.3
    }
  ]
}
```

---

## 📈 **Analytics & Reporting**

### **Dealer Dashboard**
```http
GET /api/analytics/dealer-dashboard
```

**Response:**
```json
{
  "consumer_metrics": {
    "total_consumers": 150,
    "verified_consumers": 120,
    "pending_consumers": 30
  },
  "battery_metrics": {
    "total_batteries": 200,
    "active_batteries": 180,
    "maintenance_batteries": 15,
    "avg_health_score": 87.5
  },
  "finance_metrics": {
    "total_applications": 180,
    "approved_applications": 150,
    "disbursed_applications": 140,
    "total_disbursed": 6300000
  },
  "service_metrics": {
    "total_tickets": 45,
    "resolved_tickets": 40,
    "avg_resolution_time": "2.5 days"
  }
}
```

### **NBFC Portfolio Analytics**
```http
GET /api/analytics/nbfc-portfolio
```

**Response:**
```json
{
  "portfolio_summary": {
    "total_applications": 180,
    "approval_rate": "83.3%",
    "disbursement_rate": "77.8%",
    "total_disbursed": 6300000,
    "avg_loan_amount": 35000
  },
  "monthly_trends": [
    {
      "month": "2024-01",
      "applications": 25,
      "approvals": 22,
      "disbursements": 20,
      "amount": 700000
    }
  ],
  "risk_metrics": {
    "overdue_rate": "5.2%",
    "collection_efficiency": "94.8%",
    "avg_credit_score": 720
  }
}
```

### **Collection Analytics**
```http
GET /api/analytics/collection-report
```

**Response:**
```json
{
  "collection_summary": {
    "total_emi_due": 1500,
    "collected_emi": 1425,
    "overdue_emi": 75,
    "collection_rate": "95.0%",
    "total_amount_due": 2812500,
    "amount_collected": 2671875
  },
  "daily_collections": [
    {
      "date": "2024-01-15",
      "collections": 25,
      "amount": 46875,
      "overdue_collections": 3
    }
  ],
  "overdue_analysis": {
    "1-7_days": 25,
    "8-15_days": 30,
    "15+_days": 20,
    "total_overdue": 75
  }
}
```

### **Battery Health Analytics**
```http
GET /api/analytics/battery-health
```

**Response:**
```json
{
  "fleet_health": {
    "excellent": {
      "count": 80,
      "percentage": "40.0%",
      "avg_health": 95.2
    },
    "good": {
      "count": 70,
      "percentage": "35.0%",
      "avg_health": 82.1
    },
    "fair": {
      "count": 35,
      "percentage": "17.5%",
      "avg_health": 65.8
    },
    "poor": {
      "count": 15,
      "percentage": "7.5%",
      "avg_health": 45.3
    }
  },
  "health_trends": [
    {
      "month": "2024-01",
      "avg_health": 87.5,
      "maintenance_count": 8
    }
  ],
  "predictive_maintenance": {
    "batteries_needing_service": 12,
    "estimated_service_cost": 24000,
    "risk_batteries": 5
  }
}
```

### **Service Performance Metrics**
```http
GET /api/analytics/service-metrics
```

**Response:**
```json
{
  "ticket_metrics": {
    "total_tickets": 150,
    "open_tickets": 15,
    "assigned_tickets": 25,
    "in_progress_tickets": 20,
    "resolved_tickets": 90
  },
  "resolution_times": {
    "avg_resolution_time": "2.3 days",
    "fastest_resolution": "0.5 days",
    "slowest_resolution": "7.2 days",
    "sla_compliance": "92.0%"
  },
  "technician_performance": [
    {
      "technician_id": 1,
      "name": "Tech One",
      "tickets_resolved": 25,
      "avg_resolution_time": "1.8 days",
      "customer_satisfaction": 4.6
    }
  ],
  "issue_categories": {
    "performance": 45,
    "charging": 35,
    "mechanical": 25,
    "electrical": 20,
    "other": 25
  }
}
```

---

## 📧 **Communication Services**

### **Send SMS**
```http
POST /api/messaging/send-sms
```

**Request Body:**
```json
{
  "to": "+919876543210",
  "message": "Your battery BAT001 is now active. Enjoy your ride!"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "MSG1234567890",
  "status": "sent",
  "to": "+919876543210"
}
```

### **Send OTP**
```http
POST /api/messaging/send-otp
```

**Request Body:**
```json
{
  "to": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "MSG1234567890",
  "status": "sent",
  "to": "+919876543210"
}
```

### **Battery Status Notification**
```http
POST /api/messaging/battery-status
```

**Request Body:**
```json
{
  "battery_id": 1,
  "consumer_phone": "+919876543210",
  "status": "active",
  "message": "Your battery BAT001 is now active"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "MSG1234567890",
  "status": "sent",
  "notification_type": "battery_status"
}
```

---

## 🚨 **Error Handling**

### **Standard Error Response Format**
```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

### **Common HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### **Error Examples**

**Validation Error (400):**
```json
{
  "error": "Missing required fields",
  "details": "Phone number and name are required"
}
```

**Authentication Error (401):**
```json
{
  "error": "Authentication required",
  "details": "Valid JWT token is required"
}
```

**Permission Error (403):**
```json
{
  "error": "Access denied",
  "details": "Insufficient permissions for this operation"
}
```

**Not Found Error (404):**
```json
{
  "error": "Battery not found",
  "details": "No battery found with serial number BAT999"
}
```

---

## ⚡ **Rate Limiting**

### **Current Limits**
- **Authentication endpoints**: 5 requests per minute per IP
- **API endpoints**: 100 requests per minute per authenticated user
- **File uploads**: 10 requests per minute per user

### **Rate Limit Response**
```json
{
  "error": "Rate limit exceeded",
  "details": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

---

## 🔧 **Testing & Development**

### **Test Endpoints**
- `GET /api/batteries/test` - Test batteries route
- `POST /api/batteries/{serial}/test` - Test battery control
- `POST /api/batteries/{serial}/test-status` - Test direct status update

### **Mock Data**
- All endpoints return realistic mock data for development
- Database constraints are enforced
- Authentication and authorization are fully functional

---

## 📚 **SDK & Libraries**

### **JavaScript/Node.js**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Example usage
const batteries = await api.get('/batteries');
const newBattery = await api.post('/batteries', {
  serial_number: 'BAT001',
  health_score: 100
});
```

### **Python**
```python
import requests

base_url = 'http://localhost:5000/api'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Example usage
response = requests.get(f'{base_url}/batteries', headers=headers)
batteries = response.json()

response = requests.post(f'{base_url}/batteries', 
                       json={'serial_number': 'BAT001', 'health_score': 100},
                       headers=headers)
```

---

## 📞 **Support & Contact**

### **API Status**
- **Production**: `https://api.ienerzy.com`
- **Staging**: `https://staging-api.ienerzy.com`
- **Development**: `http://localhost:5000`

### **Documentation**
- **Interactive API Docs**: Swagger UI available at `/api-docs`
- **Postman Collection**: Available for download
- **GitHub Repository**: Source code and issues

### **Contact**
- **Technical Support**: tech@ienerzy.com
- **API Issues**: api-issues@ienerzy.com
- **Documentation**: docs@ienerzy.com

---

*Last Updated: January 2024*
*API Version: v1*
*Documentation Version: 1.0* 