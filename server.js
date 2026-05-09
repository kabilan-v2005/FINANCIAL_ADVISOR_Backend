const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

dotenv.config();

// Import models
const User = require("./models/User");
const Statement = require("./models/Statement");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GROQ_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in .env");
  process.exit(1);
}

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("❌ Missing JWT_SECRET in .env");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

/* ===========================
   AUTHENTICATION ENDPOINTS
=========================== */

// POST /register - Create new user
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Please provide name, email, and password",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        error: "User already exists with that email",
      });
    }

    // Create new user
    user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({
      error: error.message || "Server error during registration",
    });
  }
});

// POST /login - Authenticate user and return JWT
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Please provide email and password",
      });
    }

    // Find user (including password field)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      error: error.message || "Server error during login",
    });
  }
});

/* ===========================
   ANALYZE ENDPOINT
=========================== */
app.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { prompt, fileName = "statement" } = req.body;
    const userId = req.userId;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // 🔥 fast + powerful
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API error");
    }

    const text = data.choices?.[0]?.message?.content || "";

    // Save to MongoDB
    const statement = await Statement.create({
      userId,
      fileName,
      aiResponse: {
        result: text.trim(),
      },
      prompt,
    });

    res.json({
      success: true,
      result: text.trim(),
      statementId: statement._id,
    });

  } catch (error) {
    console.error("🔥 Groq API error:", error);

    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

/* ===========================
   CHAT ENDPOINT (OPTIONAL 🔥)
=========================== */
app.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const messages = [
      ...history,
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages,
        temperature: 0.4,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API error");
    }

    const reply = data.choices?.[0]?.message?.content || "";

    res.json({ reply });

  } catch (error) {
    console.error("🔥 Chat error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/* ===========================
   HISTORY ENDPOINT
=========================== */
app.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get all statements for this user, sorted by newest first
    const statements = await Statement.find({ userId })
      .sort({ createdAt: -1 })
      .select("fileName prompt aiResponse createdAt");

    res.json({
      success: true,
      count: statements.length,
      statements,
    });
  } catch (error) {
    console.error("❌ History error:", error);
    res.status(500).json({
      error: error.message || "Server error fetching history",
    });
  }
});

// GET /history/:statementId - Get single statement
app.get("/history/:statementId", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { statementId } = req.params;

    const statement = await Statement.findOne({
      _id: statementId,
      userId, // Ensure user owns this statement
    });

    if (!statement) {
      return res.status(404).json({
        error: "Statement not found",
      });
    }

    res.json({
      success: true,
      statement,
    });
  } catch (error) {
    console.error("❌ Statement fetch error:", error);
    res.status(500).json({
      error: error.message || "Server error fetching statement",
    });
  }
});

/* ===========================
   HEALTH CHECK
=========================== */
app.get("/", (req, res) => {
  res.send("✅ FinSight backend running with GROQ + MongoDB");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});