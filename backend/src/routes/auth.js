const { Router } = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { authMiddleware } = require("../auth/middleware");

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me - Get current user profile (protected)
router.get("/me", authMiddleware, getMe);

module.exports = router;