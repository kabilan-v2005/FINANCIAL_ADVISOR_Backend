# FinSight Multi-User Backend - Quick Start (5 minutes)

## 1. Install Dependencies
```bash
npm install bcryptjs jsonwebtoken
```

## 2. Set Up MongoDB Atlas (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up → Create cluster (free M0 tier)
3. Create database user with password
4. Get connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/finsight`)

## 3. Create .env File
```env
GROQ_API_KEY=your_groq_key_here
JWT_SECRET=generate_random_string_with_node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/finsight
PORT=5000
```

## 4. Start Server
```bash
node server.js
```

Expected output:
```
✅ MongoDB connected successfully
🚀 Server running at http://localhost:5000
```

## 5. Test with Postman (Easiest!)

**Import the collection:**
- Open Postman
- Click Import → Select `FinSight_API_Collection.postman_collection.json`
- Run endpoints in order:
  1. **Register** - Creates account & auto-saves token
  2. **Analyze Statement** - Uses token to save statement
  3. **Get History** - Shows user's saved statements

---

## 6. Test with cURL (Terminal)

### Register
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

Response includes `"token": "eyJhbGciOiJIUzI1NiIs..."`

### Copy token and use it:
```bash
TOKEN="your_token_here"

# Analyze statement
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "Analyze: Salary 5000, Rent -1200, Groceries -150",
    "fileName": "jan_2024.csv"
  }'

# Get history
curl -X GET http://localhost:5000/history \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. What's New?

✅ **3 New Files Created:**
- `models/User.js` - User schema with password hashing
- `models/Statement.js` - Statement storage schema  
- `middleware/authMiddleware.js` - JWT verification

✅ **server.js Updated:**
- Added MongoDB connection
- Added /register & /login endpoints
- Protected /analyze with authentication
- Added /history endpoint
- All endpoints validate user ownership

✅ **Documentation:**
- `API_DOCS.md` - Full API reference
- `IMPLEMENTATION_GUIDE.md` - How everything works
- `FinSight_API_Collection.postman_collection.json` - Ready-to-use tests

---

## 8. Key Features

| Feature | Before | After |
|---------|--------|-------|
| Users | Single user | Multiple users |
| Authentication | None | JWT tokens |
| Data Storage | In memory | MongoDB |
| Privacy | N/A | Each user sees only their data |
| History | Lost on restart | Persistent in database |
| Session | Single session | 7-day tokens |

---

## 9. Token-Based Access

Every protected request needs:
```
Authorization: Bearer <your_token_here>
```

Token format: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 10. Frontend Integration (Quick Example)

```javascript
// Login/Register
const response = await fetch('http://localhost:5000/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
const token = data.token;

// Store token
localStorage.setItem('token', token);

// Use in protected requests
const analyzeRes = await fetch('http://localhost:5000/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ prompt, fileName })
});
```

---

## 11. Troubleshooting

| Error | Solution |
|-------|----------|
| "Missing MONGO_URI" | Add MONGO_URI to .env |
| "MongoDB connection failed" | Check connection string, verify IP whitelist |
| "Not authorized" | Include `Authorization: Bearer <token>` header |
| "Invalid credentials" | Check email/password spelling |
| "User already exists" | Use different email for testing |

---

## 12. That's It! 🎉

You now have a **production-ready multi-user backend** with:
- ✅ User authentication
- ✅ Persistent data storage
- ✅ Security best practices
- ✅ Data isolation per user
- ✅ Clean code structure

For detailed documentation, see:
- `API_DOCS.md` - All endpoints & examples
- `IMPLEMENTATION_GUIDE.md` - How to integrate with frontend

Happy coding! 🚀
