# FinSight Multi-User Implementation Guide

## What Changed

Your single-user AI app is now a **production-ready multi-user system** with:

✅ User authentication (register/login)
✅ JWT token-based access control  
✅ MongoDB database for persistent storage
✅ User data isolation (each user sees only their data)
✅ Password encryption with bcrypt
✅ Protected API endpoints
✅ Error handling & validation

---

## Setup Steps

### 1. Install New Dependencies

```bash
npm install bcryptjs jsonwebtoken
```

**What these packages do:**
- `bcryptjs` - Hashes passwords securely
- `jsonwebtoken` - Creates and verifies JWT tokens

### 2. Set Up MongoDB Atlas

**Free tier includes 512 MB storage - perfect for testing!**

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create an account (free)
3. Create a **new project** and **cluster** (M0 free tier)
4. Go to **Database Access** → Create user with password
5. Go to **Network Access** → Allow access from your IP
6. Click **Connect** → Select **Drivers** → Copy connection string

Your connection string looks like:
```
mongodb+srv://myusername:mypassword@cluster0.mongodb.net/finsight?retryWrites=true&w=majority
```

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Update with your values:

```env
GROQ_API_KEY=your_groq_key
JWT_SECRET=generate_a_long_random_string_here
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/finsight
PORT=5000
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start Server

```bash
node server.js
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running at http://localhost:5000
```

---

## How It Works

### Authentication Flow

```
User Registration
    ↓
[Request: name, email, password]
    ↓
Check if email exists
    ↓
Hash password with bcrypt
    ↓
Save user to MongoDB
    ↓
Generate JWT token (expires in 7 days)
    ↓
Return token to client
    ↓
[Client stores token]
```

### Protected Requests

```
User makes API request
    ↓
[Include token in Authorization header]
    ↓
authMiddleware checks token
    ↓
Token valid? Extract userId
    ↓
Attach userId to request
    ↓
Process request with user context
    ↓
Example: /analyze saves data with userId
```

### Data Isolation

Every request with a token includes `userId`. The backend uses this to:
- Save statements only for that user
- Return only that user's history
- Prevent access to other users' data

---

## API Usage Examples

### Example 1: Register & Get Token

```bash
# Register new user
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Johnson",
    "email": "sarah@example.com",
    "password": "MySecurePass123!"
  }'

# Response:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { "id": "...", "name": "Sarah Johnson", "email": "sarah@example.com" }
# }

# Save the token, use it for all future requests
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Analyze Statement (Requires Token)

```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "Analyze these transactions: [CSV DATA]",
    "fileName": "jan_2024_statement.csv"
  }'

# Response:
# {
#   "success": true,
#   "result": "[AI ANALYSIS]",
#   "statementId": "507f1f77bcf86cd799439012"
# }
```

The statement is automatically saved to MongoDB with:
- `userId` (extracted from token)
- `aiResponse` (AI analysis)
- `fileName`
- `createdAt` (timestamp)

### Example 3: Get User's History

```bash
curl -X GET http://localhost:5000/history \
  -H "Authorization: Bearer $TOKEN"

# Response shows only THIS user's statements:
# {
#   "success": true,
#   "count": 3,
#   "statements": [
#     { "fileName": "jan_2024.csv", "aiResponse": {...}, "createdAt": "..." },
#     { "fileName": "dec_2023.csv", "aiResponse": {...}, "createdAt": "..." },
#     ...
#   ]
# }
```

---

## Frontend Integration

### 1. Register/Login (Store Token)

```javascript
// After successful login/register
const response = await fetch('http://localhost:5000/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
localStorage.setItem('token', data.token);
```

### 2. Make Protected Requests

```javascript
// In your API calls, include the token
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ prompt, fileName })
});
```

### 3. Handle Token Expiration

```javascript
// If response is 401, token expired
if (response.status === 401) {
  localStorage.removeItem('token');
  // Redirect to login
  window.location.href = '/login';
}
```

---

## File Structure

```
d:\FinSight\
├── server.js                    # Main server (UPDATED)
├── package.json
├── .env                         # Your secrets (NEVER commit)
├── .env.example                 # Template for .env
│
├── models/
│   ├── User.js                  # User schema + password hashing
│   └── Statement.js             # Statement schema
│
├── middleware/
│   └── authMiddleware.js        # JWT verification & validation
│
├── API_DOCS.md                  # Full API documentation
├── FinSight_API_Collection.postman_collection.json  # Postman tests
└── IMPLEMENTATION_GUIDE.md      # This file
```

---

## Database Schema

### Users Collection
```
{
  _id: ObjectId (auto-generated),
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$10$..." (hashed),
  createdAt: 2024-01-15T10:30:00Z,
  updatedAt: 2024-01-15T10:30:00Z
}
```

### Statements Collection
```
{
  _id: ObjectId (auto-generated),
  userId: ObjectId (ref to User),
  fileName: "statement_jan_2024.csv",
  prompt: "Analyze this...",
  aiResponse: {
    result: "Based on your statement..."
  },
  createdAt: 2024-01-15T10:35:00Z,
  updatedAt: 2024-01-15T10:35:00Z
}
```

---

## Security Best Practices ✅

✅ **Passwords are hashed** with bcrypt (10 salt rounds)
- Even if database is breached, passwords are unreadable

✅ **JWT tokens expire** after 7 days
- Forces users to login periodically

✅ **User data isolation**
- Query includes `userId` filter
- User sees only their own statements

✅ **Input validation**
- Email format validation
- Password length requirements
- Prevents SQL injection

✅ **Error handling**
- Doesn't leak database details
- Generic error messages for security

---

## Testing the System

### Option 1: Use Postman (Easiest)

1. Import `FinSight_API_Collection.postman_collection.json` into Postman
2. Set `baseUrl` to `http://localhost:5000`
3. Run endpoints in order:
   - Register (auto-saves token)
   - Analyze Statement (uses saved token)
   - Get History (uses saved token)

### Option 2: Use cURL

```bash
# 1. Register
TOKEN=$(curl -s -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Analyze
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt":"Analyze: ...","fileName":"test.csv"}'

# 3. Get history
curl -X GET http://localhost:5000/history \
  -H "Authorization: Bearer $TOKEN"
```

### Option 3: Use REST Client (VS Code Extension)

Create `requests.http`:
```http
### Register
POST http://localhost:5000/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}

### Analyze (replace TOKEN with actual token)
POST http://localhost:5000/analyze
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "prompt": "Analyze my spending",
  "fileName": "statement.csv"
}
```

---

## Common Issues & Solutions

### ❌ "MongoDB connection failed"
**Solution:** 
- Check MONGO_URI in .env
- Verify MongoDB Atlas credentials
- Ensure IP is whitelisted in Atlas

### ❌ "Not authorized to access this route"
**Solution:**
- Include `Authorization: Bearer <token>` header
- Make sure token hasn't expired (7 days)
- Token format must be `Bearer <token>`

### ❌ "User already exists with that email"
**Solution:**
- Use a different email for testing
- Or delete the user from MongoDB directly

### ❌ "Invalid credentials"
**Solution:**
- Check email and password spelling
- Passwords are case-sensitive
- Email must match registered email

### ❌ Port 5000 already in use
**Solution:**
- Change PORT in .env to 5001, 5002, etc.
- Or kill existing process on port 5000

---

## What Happens to Old AI Logic?

✅ **Nothing changed!** The AI analysis logic remains identical:
- Same Groq API integration
- Same prompt handling
- Same response format
- Same /chat endpoint

The only change is:
- Results are now saved to MongoDB with userId
- Endpoints require authentication token
- Users can view their history

---

## Next Steps

1. **Test thoroughly** - Use Postman collection
2. **Update frontend** - Add login/register screens
3. **Store tokens** - Save in localStorage
4. **Add logout** - Clear token on logout
5. **Show history** - Display user's past analyses
6. **Error handling** - Handle 401 responses gracefully

---

## Production Checklist

- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Use actual MongoDB Atlas cluster (not local)
- [ ] Set CORS properly for your frontend domain
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Set NODE_ENV=production
- [ ] Add HTTPS (required for production)
- [ ] Set up monitoring/logging
- [ ] Add rate limiting
- [ ] Backup MongoDB regularly
- [ ] Test token expiration flow
- [ ] Set up automated tests

---

## Support

For issues or questions:
1. Check error message carefully
2. Review API_DOCS.md
3. Check MongoDB Atlas connection
4. Verify .env variables
5. Check console logs for details
