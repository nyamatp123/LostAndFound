const { Router } = require("express");
const { authMiddleware } = require("../auth/middleware");
const {
  createItem,
  getUserItems,
  getItemById,
  updateItemStatus
} = require("../controllers/itemsController");

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/items - Create new item
router.post("/", createItem);

// GET /api/items - Get user's items
router.get("/", getUserItems);

// GET /api/items/:id - Get single item
router.get("/:id", getItemById);

// PATCH /api/items/:id/status - Update item status
router.patch("/:id/status", updateItemStatus);

module.exports = router;