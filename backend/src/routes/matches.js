const { Router } = require("express");
const { authMiddleware } = require("../auth/middleware");
const {
  getMatchesForItem,
  getPotentialMatches,
  confirmMatch,
  rejectMatch
} = require("../controllers/matchesController");

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/matches/potential/:lostItemId - Get potential matches for a lost item
router.get("/potential/:lostItemId", getPotentialMatches);

// GET /api/matches/:itemId - Get matches for an item
router.get("/:itemId", getMatchesForItem);

// POST /api/matches/:matchId/confirm - Confirm a match
router.post("/:matchId/confirm", confirmMatch);

// POST /api/matches/:matchId/reject - Reject a match
router.post("/:matchId/reject", rejectMatch);

module.exports = router;