const { prisma } = require("../database/prisma");
const { createNotification } = require("../utils/notifications");

/**
 * Get all matches for a specific item
 */
const getMatchesForItem = async (req, res) => {
  try {
    const user = req.user;
    const itemId = parseInt(req.params.itemId);

    if (isNaN(itemId)) {
      return res.status(400).json({
        error: "Invalid item ID"
      });
    }

    // Verify item belongs to user
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({
        error: "Item not found"
      });
    }

    if (item.userId !== user.id) {
      return res.status(403).json({
        error: "Not authorized to view matches for this item"
      });
    }

    // Get matches based on item type
    const matches = item.type === "lost"
      ? await prisma.match.findMany({
          where: { lostItemId: itemId },
          include: {
            foundItem: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            },
            lostItem: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: { confidence: "desc" }
        })
      : await prisma.match.findMany({
          where: { foundItemId: itemId },
          include: {
            lostItem: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            },
            foundItem: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: { confidence: "desc" }
        });

    res.json(matches);
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({
      error: "Internal server error while fetching matches"
    });
  }
};

/**
 * Confirm a match
 */
const confirmMatch = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);
    const { proofDetails } = req.body;

    if (isNaN(matchId)) {
      return res.status(400).json({
        error: "Invalid match ID"
      });
    }

    // Get match with related items
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        foundItem: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        error: "Match not found"
      });
    }

    // Determine which user is confirming
    let updateData = {};
    let isLostUser = false;
    let isFoundUser = false;

    if (match.lostItem.userId === user.id) {
      updateData.confirmedByLostUser = true;
      isLostUser = true;
    } else if (match.foundItem.userId === user.id) {
      updateData.confirmedByFoundUser = true;
      isFoundUser = true;
    } else {
      return res.status(403).json({
        error: "Not authorized to confirm this match"
      });
    }

    // Add proof details if provided
    if (proofDetails) {
      updateData.proofDetails = proofDetails;
    }

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData
    });

    // Check if both users have confirmed
    if (updatedMatch.confirmedByLostUser && updatedMatch.confirmedByFoundUser) {
      // Both confirmed - update match status and item statuses
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "confirmed" }
      });

      await prisma.item.update({
        where: { id: match.lostItem.id },
        data: { status: "matched" }
      });

      await prisma.item.update({
        where: { id: match.foundItem.id },
        data: { status: "matched" }
      });

      // Notify both users
      await createNotification(
        match.lostItem.userId,
        "match_confirmed",
        "Match Confirmed!",
        `Both parties confirmed the match. You can now contact the finder.`,
        {
          matchId,
          otherUserId: match.foundItem.userId,
          otherUserName: match.foundItem.user?.name || "Unknown"
        }
      );

      await createNotification(
        match.foundItem.userId,
        "match_confirmed",
        "Match Confirmed!",
        `Both parties confirmed the match. You can now contact the owner.`,
        {
          matchId,
          otherUserId: match.lostItem.userId,
          otherUserName: match.lostItem.user?.name || "Unknown"
        }
      );
    } else {
      // Only one confirmed - notify the other party
      const otherUserId = isLostUser ? match.foundItem.userId : match.lostItem.userId;
      const otherUserName = isLostUser ? match.foundItem.user?.name : match.lostItem.user?.name;

      await createNotification(
        otherUserId,
        "confirmation_pending",
        "Match Confirmation Pending",
        `${user.name} confirmed the match. Please confirm too!`,
        { matchId }
      );
    }

// Fetch updated match with full details
const finalMatch = await prisma.match.findUnique({
  where: { id: matchId },
  include: {
    lostItem: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    },
    foundItem: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    }
  }
});

res.json(finalMatch);
} catch (error) {
  console.error("Confirm match error:", error);
  res.status(500).json({
    error: "Internal server error while confirming match"
  });
}
};

/**
 * Reject a match
 */
const rejectMatch = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);

    if (isNaN(matchId)) {
      return res.status(400).json({
        error: "Invalid match ID"
      });
    }

    // Get match with related items
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: true,
        foundItem: true
      }
    });

    if (!match) {
      return res.status(404).json({
        error: "Match not found"
      });
    }

    // Verify user is part of this match
    if (match.lostItem.userId !== user.id && match.foundItem.userId !== user.id) {
      return res.status(403).json({
        error: "Not authorized to reject this match"
      });
    }

    // Update match status to rejected
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { status: "rejected" }
    });

    res.json({
      success: true,
      message: "Match rejected successfully",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Reject match error:", error);
    res.status(500).json({
      error: "Internal server error while rejecting match"
    });
  }
};

module.exports = {
  getMatchesForItem,
  confirmMatch,
  rejectMatch
};