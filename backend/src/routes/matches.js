const { Router } = require("express");
const { authMiddleware } = require("../auth/middleware");
const {
  getMatchesForItem,
  confirmMatch,
  rejectMatch
} = require("../controllers/matchesController");

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/matches/:itemId - Get matches for an item
router.get("/:itemId", getMatchesForItem);

// POST /api/matches/:matchId/confirm - Confirm a match
router.post("/:matchId/confirm", confirmMatch);

// POST /api/matches/:matchId/reject - Reject a match
router.post("/:matchId/reject", rejectMatch);

module.exports = router;