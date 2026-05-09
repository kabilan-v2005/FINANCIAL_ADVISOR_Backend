const jwt = require("jsonwebtoken");

// Middleware to verify JWT token and attach user to request
const authMiddleware = (req, res, next) => {
  try {
    let token;

    // Check if token is in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        error: "Not authorized to access this route",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({
      error: "Not authorized to access this route",
    });
  }
};

module.exports = authMiddleware;
