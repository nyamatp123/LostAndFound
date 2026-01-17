const { verifyToken } = require("./auth");
const { prisma } = require("../database/prisma");

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: "Missing authorization header" 
      });
    }

    // Extract token (format: "Bearer <token>")
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ 
        error: "Invalid authorization header format. Use 'Bearer <token>'" 
      });
    }

    const token = parts[1];

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ 
        error: "Invalid or expired token" 
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({ 
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        university: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: "User not found" 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ 
      error: "Internal server error in authentication" 
    });
  }
};

module.exports = { authMiddleware };