const { Router } = require("express");
const { authMiddleware } = require("../auth/middleware");
const {
  createItem,
  getUserItems,
  getItemById,
  updateItemStatus,
  deleteItem,
  getFoundItemsWithClaimStatus,
  updateClaimDetails
} = require("../controllers/itemsController");

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/items - Create new item
router.post("/", createItem);

// GET /api/items - Get user's items
router.get("/", getUserItems);

// GET /api/items/found-with-status - Get found items with claim status (for finder dashboard)
router.get("/found-with-status", getFoundItemsWithClaimStatus);

// GET /api/items/:id - Get single item
router.get("/:id", getItemById);

// PATCH /api/items/:id/status - Update item status
router.patch("/:id/status", updateItemStatus);

// DELETE /api/items/:id - Delete an item
router.delete("/:id", deleteItem);

// PUT /api/items/claims/:matchId - Update claim details (finder action)
router.put("/claims/:matchId", updateClaimDetails);

module.exports = router;