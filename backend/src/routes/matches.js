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
  completeReturn,
  getClaimDetails,
  acceptClaim,
  declineClaim,
  proposeAlternative,
  acceptProposal,
  rejectProposal,
  getClaimsForFinder,
  getMatchForLostItem
} = require("../controllers/matchesController");

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/matches - Create a new match (claim an item)
router.post("/", createMatch);

// GET /api/matches/claims - Get all claims for finder (items I found that were claimed)
router.get("/claims", getClaimsForFinder);

// GET /api/matches/lost-item/:itemId - Get the active match for a lost item
router.get("/lost-item/:itemId", getMatchForLostItem);

// GET /api/matches/potential/:lostItemId - Get potential matches for a lost item
router.get("/potential/:lostItemId", getPotentialMatches);

// GET /api/matches/:itemId - Get matches for an item
router.get("/:itemId", getMatchesForItem);

// GET /api/matches/:matchId/status - Get match status (for polling)
router.get("/:matchId/status", getMatchStatus);

// GET /api/matches/:matchId/claim-details - Get full claim details for finder review
router.get("/:matchId/claim-details", getClaimDetails);

// POST /api/matches/:matchId/confirm - Confirm a match
router.post("/:matchId/confirm", confirmMatch);

// POST /api/matches/:matchId/reject - Reject a match
router.post("/:matchId/reject", rejectMatch);

// POST /api/matches/:matchId/accept - Finder accepts a claim
router.post("/:matchId/accept", acceptClaim);

// POST /api/matches/:matchId/decline - Finder declines a claim
router.post("/:matchId/decline", declineClaim);

// POST /api/matches/:matchId/propose - Finder proposes alternative
router.post("/:matchId/propose", proposeAlternative);

// POST /api/matches/:matchId/accept-proposal - Claimant accepts proposal
router.post("/:matchId/accept-proposal", acceptProposal);

// POST /api/matches/:matchId/reject-proposal - Claimant rejects proposal
router.post("/:matchId/reject-proposal", rejectProposal);

// PUT /api/matches/:matchId/preference - Update return method preference
router.put("/:matchId/preference", updatePreference);

// POST /api/matches/:matchId/notify - Notify owner about drop-off
router.post("/:matchId/notify", notifyReturn);

// POST /api/matches/:matchId/complete - Mark item as returned
router.post("/:matchId/complete", completeReturn);

module.exports = router;