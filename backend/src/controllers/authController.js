const { prisma } = require("../database/prisma");
const { hashPassword, verifyPassword, createToken } = require("../auth/auth");

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { email, password, name, phone, university } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Missing required fields: email, password, name"
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format"
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long"
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Email already registered"
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
        university: university || null
      }
    });

    // Create JWT token
    const token = createToken(user.id);

    // Return response
    res.status(201).json({
      access_token: token,
      token_type: "bearer",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        university: user.university,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      error: "Internal server error during registration"
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Missing required fields: email, password"
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // Create JWT token
    const token = createToken(user.id);

    // Return response
    res.json({
      access_token: token,
      token_type: "bearer",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        university: user.university,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error during login"
    });
  }
};

module.exports = {
  register,
  login
};