# FinSight API Documentation

## Overview
Multi-user Finance Advisor API with JWT authentication, MongoDB storage, and AI-powered analysis.

## Environment Variables (.env)
Add these to your `.d:\FinSight\.env` file:

```env
# Existing
GROQ_API_KEY=your_groq_api_key_here
PORT=5000

# New - Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# New - Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/finsight?retryWrites=true&w=majority
```

**MongoDB Atlas Setup:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create a database user with a password
4. Get the connection string and add it to `.env` as `MONGO_URI`

## Installation

Install required packages:
```bash
npm install bcryptjs jsonwebtoken
```

## API Endpoints

### 1. Authentication

#### POST /register
Create a new user account.

**Request:**
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST /login
Authenticate and get JWT token.

**Request:**
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 2. Analysis

#### POST /analyze (Protected)
Analyze bank statement with AI and save to database.

**Headers Required:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "prompt": "Analyze this bank statement: [CSV data here]",
    "fileName": "statement_jan_2024.csv"
  }'
```

**Response:**
```json
{
  "success": true,
  "result": "Based on your bank statement, here are your insights: [AI analysis]...",
  "statementId": "507f1f77bcf86cd799439012"
}
```

### 3. History

#### GET /history (Protected)
Retrieve all analysis history for logged-in user.

**Request:**
```bash
curl -X GET http://localhost:5000/history \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "statements": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "fileName": "statement_jan_2024.csv",
      "prompt": "Analyze this bank statement...",
      "aiResponse": {
        "result": "Based on your bank statement..."
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### GET /history/:statementId (Protected)
Retrieve a specific statement.

**Request:**
```bash
curl -X GET http://localhost:5000/history/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "statement": {
    "_id": "507f1f77bcf86cd799439012",
    "fileName": "statement_jan_2024.csv",
    "prompt": "Analyze this bank statement...",
    "aiResponse": {
      "result": "Based on your bank statement..."
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Chat

#### POST /chat (Protected)
Continue conversation with AI.

**Headers Required:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "message": "What are my top spending categories?",
    "history": []
  }'
```

**Response:**
```json
{
  "reply": "Based on your analysis, your top spending categories are..."
}
```

## Complete Example Flow

### Step 1: Register
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123"
  }'
```
Save the returned `token`.

### Step 2: Use token for subsequent requests
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Analyze a statement
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "Analyze my spending patterns from this CSV: ...",
    "fileName": "jan_2024_statement.csv"
  }'

# Get history
curl -X GET http://localhost:5000/history \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling

### 401 - Unauthorized (Missing/Invalid Token)
```json
{
  "error": "Not authorized to access this route"
}
```

### 400 - Bad Request
```json
{
  "error": "Please provide email and password"
}
```

### 500 - Server Error
```json
{
  "error": "Server error during login"
}
```

## Security Features

✅ **Passwords hashed** with bcrypt (10 salt rounds)
✅ **JWT tokens** expire after 7 days
✅ **User isolation** - each user sees only their data
✅ **MongoDB indexing** for fast queries
✅ **Input validation** on all endpoints
✅ **CORS enabled** for frontend integration

## File Structure

```
d:\FinSight\
├── server.js              # Main server (updated)
├── package.json          # Dependencies
├── .env                  # Environment variables
├── models\
│   ├── User.js           # User schema with password hashing
│   └── Statement.js      # Statement schema
├── middleware\
│   └── authMiddleware.js # JWT verification
└── API_DOCS.md           # This file
```

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Statement Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  fileName: String,
  aiResponse: Object,
  prompt: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Tips

- Store JWT token in localStorage/sessionStorage on frontend
- Include token in `Authorization: Bearer <token>` header for protected routes
- Token expires after 7 days - user needs to login again
- Each user can only access their own statements
- Use GET /history to show user's past analyses

## Testing with Postman

1. Create collection "FinSight API"
2. Add environment variable: `token` and `baseUrl`
3. Register endpoint:
   - POST `{{baseUrl}}/register`
   - Body: `{"name": "Test", "email": "test@test.com", "password": "pass123"}`
   - Tests: `pm.environment.set("token", pm.response.json().token);`
4. Analyze endpoint:
   - POST `{{baseUrl}}/analyze`
   - Header: `Authorization: Bearer {{token}}`
   - Body: `{"prompt": "Analyze: ...", "fileName": "test.csv"}`
5. History endpoint:
   - GET `{{baseUrl}}/history`
   - Header: `Authorization: Bearer {{token}}`
