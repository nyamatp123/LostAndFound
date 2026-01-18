const { Router } = require("express");
const { authMiddleware } = require("../auth/middleware");
const {
  createMatch,
  getMatchesForItem,
  getPotentialMatches,
  confirmMatch,
  rejectMatch,
  updatePreference,
  getMatchStatus,
  notifyReturn,
  completeReturn
} = require("../controllers/matchesController");

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/matches - Create a new match (claim an item)
router.post("/", createMatch);

// GET /api/matches/potential/:lostItemId - Get potential matches for a lost item
router.get("/potential/:lostItemId", getPotentialMatches);

// GET /api/matches/:itemId - Get matches for an item
router.get("/:itemId", getMatchesForItem);

// GET /api/matches/:matchId/status - Get match status (for polling)
router.get("/:matchId/status", getMatchStatus);

// POST /api/matches/:matchId/confirm - Confirm a match
router.post("/:matchId/confirm", confirmMatch);

// POST /api/matches/:matchId/reject - Reject a match
router.post("/:matchId/reject", rejectMatch);

// PUT /api/matches/:matchId/preference - Update return method preference
router.put("/:matchId/preference", updatePreference);

// POST /api/matches/:matchId/notify - Notify owner about drop-off
router.post("/:matchId/notify", notifyReturn);

// POST /api/matches/:matchId/complete - Mark item as returned
router.post("/:matchId/complete", completeReturn);

module.exports = router;