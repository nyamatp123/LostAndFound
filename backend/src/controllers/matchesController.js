const { prisma } = require("../database/prisma");
const { createNotification } = require("../utils/notifications");
const { cosineSim } = require("../utils/similarity");

/**
 * Calculate distance between two coordinates in km (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get potential matches for a lost item
 * Finds found items that match based on location, time, and description
 */
const getPotentialMatches = async (req, res) => {
  try {
    const user = req.user;
    const lostItemId = parseInt(req.params.lostItemId);

    if (isNaN(lostItemId)) {
      return res.status(400).json({
        error: "Invalid item ID"
      });
    }

    // Get the lost item
    const lostItem = await prisma.item.findUnique({
      where: { id: lostItemId }
    });

    if (!lostItem) {
      return res.status(404).json({
        error: "Lost item not found"
      });
    }

    if (lostItem.userId !== user.id) {
      return res.status(403).json({
        error: "Not authorized to view matches for this item"
      });
    }

    if (lostItem.type !== "lost") {
      return res.status(400).json({
        error: "Item must be a lost item"
      });
    }

    // Get all found items that are still active/unfound
    const foundItems = await prisma.item.findMany({
      where: {
        type: "found",
        status: { in: ["unfound", "active"] },
        // Found after the item was lost
        timestamp: { gte: lostItem.timestamp }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Calculate scores for each found item
    const potentialMatches = [];
    
    // Parse lost item location
    let lostLocation = lostItem.location;
    if (typeof lostLocation === 'string') {
      try {
        lostLocation = JSON.parse(lostLocation);
      } catch (e) {
        lostLocation = {};
      }
    }
    const lostLat = lostLocation?.latitude;
    const lostLon = lostLocation?.longitude;

    for (const foundItem of foundItems) {
      // Parse found item location
      let foundLocation = foundItem.location;
      if (typeof foundLocation === 'string') {
        try {
          foundLocation = JSON.parse(foundLocation);
        } catch (e) {
          foundLocation = {};
        }
      }
      const foundLat = foundLocation?.latitude;
      const foundLon = foundLocation?.longitude;

      // Calculate distance score (0-1, higher is better)
      let distanceScore = 0;
      if (lostLat && lostLon && foundLat && foundLon) {
        const distance = calculateDistance(lostLat, lostLon, foundLat, foundLon);
        // Within 5km = high score, decreases after that
        distanceScore = Math.max(0, 1 - (distance / 10)); // 0 at 10km+
      } else {
        // If no location data, give neutral score
        distanceScore = 0.5;
      }

      // Calculate time score (0-1, items found soon after being lost score higher)
      const timeDiff = new Date(foundItem.timestamp) - new Date(lostItem.timestamp);
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      const timeScore = Math.max(0, 1 - (daysDiff / 30)); // Decreases over 30 days

      // Calculate similarity score using text embeddings
      let similarityScore = 0;
      if (lostItem.textEmbedding && foundItem.textEmbedding) {
        try {
          similarityScore = cosineSim(lostItem.textEmbedding, foundItem.textEmbedding);
        } catch (e) {
          similarityScore = 0;
        }
      }

      // Category match bonus
      const categoryBonus = lostItem.category === foundItem.category ? 0.2 : 0;

      // Calculate overall score
      const score = (
        0.3 * distanceScore +
        0.2 * timeScore +
        0.3 * similarityScore +
        0.2 * categoryBonus
      );

      // Only include if score is above threshold
      if (score > 0.1) {
        potentialMatches.push({
          item: {
            id: foundItem.id.toString(),
            title: foundItem.title,
            name: foundItem.title, // For frontend compatibility
            description: foundItem.description,
            category: foundItem.category,
            location: foundLocation?.latitude && foundLocation?.longitude
              ? `${foundLocation.latitude.toFixed(4)}, ${foundLocation.longitude.toFixed(4)}`
              : "Unknown location",
            timestamp: foundItem.timestamp.toISOString(),
            imageUrl: foundItem.imageUrls?.[0] || null,
            user: foundItem.user
          },
          score,
          distanceScore,
          timeScore,
          similarityScore
        });
      }
    }

    // Sort by score descending
    potentialMatches.sort((a, b) => b.score - a.score);

    res.json(potentialMatches);
  } catch (error) {
    console.error("Get potential matches error:", error);
    res.status(500).json({
      error: "Internal server error while finding potential matches"
    });
  }
};

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
  getPotentialMatches,
  confirmMatch,
  rejectMatch
};