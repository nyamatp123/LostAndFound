const { prisma } = require("../database/prisma");
const { createNotification } = require("../utils/notifications");
const { calculateBatchMatchScores, calculateDistanceMeters, calculateMatchScore } = require("../utils/matching");

/**
 * Create a new match between a lost item and found item
 */
const createMatch = async (req, res) => {
  try {
    const user = req.user;
    const { lostItemId, foundItemId } = req.body;

    if (!lostItemId || !foundItemId) {
      return res.status(400).json({
        error: "Both lostItemId and foundItemId are required"
      });
    }

    const lostId = parseInt(lostItemId);
    const foundId = parseInt(foundItemId);

    if (isNaN(lostId) || isNaN(foundId)) {
      return res.status(400).json({
        error: "Invalid item IDs"
      });
    }

    // Get both items
    const [lostItem, foundItem] = await Promise.all([
      prisma.item.findUnique({ where: { id: lostId } }),
      prisma.item.findUnique({ where: { id: foundId } })
    ]);

    if (!lostItem) {
      return res.status(404).json({ error: "Lost item not found" });
    }

    if (!foundItem) {
      return res.status(404).json({ error: "Found item not found" });
    }

    // Verify the user owns the lost item
    if (lostItem.userId !== user.id) {
      return res.status(403).json({
        error: "Not authorized to create a match for this lost item"
      });
    }

    // Check if a match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        lostItemId: lostId,
        foundItemId: foundId
      }
    });

    if (existingMatch) {
      return res.status(409).json({
        error: "A match already exists for these items",
        match: existingMatch
      });
    }

    // Calculate match score
    const matchResult = await calculateMatchScore(lostItem, foundItem);

    // Create the match
    const match = await prisma.match.create({
      data: {
        lostItemId: lostId,
        foundItemId: foundId,
        confidence: matchResult.finalScore,
        breakdown: matchResult.breakdown,
        explanation: `Match score: ${matchResult.finalScore.toFixed(1)}%`,
        status: "pending",
        confirmedByLostUser: true // Owner is claiming, so they confirm
      },
      include: {
        lostItem: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        foundItem: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    // Update both items' status to 'matched'
    await Promise.all([
      prisma.item.update({
        where: { id: lostId },
        data: { status: "matched" }
      }),
      prisma.item.update({
        where: { id: foundId },
        data: { status: "matched" }
      })
    ]);

    // Notify the finder about the claim
    await createNotification(
      foundItem.userId,
      "match_created",
      "Someone Claimed Your Found Item!",
      `${user.name} believes the ${foundItem.title} you found belongs to them.`,
      {
        matchId: match.id,
        lostItemId: lostId,
        foundItemId: foundId
      }
    );

    res.status(201).json(match);
  } catch (error) {
    console.error("Create match error:", error);
    res.status(500).json({
      error: "Internal server error while creating match"
    });
  }
};

/**
 * Get potential matches for a lost item
 * Finds found items that match based on location, time, and description
 * Uses the new weighted scoring algorithm with Gemini AI
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
    // Exclude items from the current user (they shouldn't see their own found items as potential matches)
    const foundItems = await prisma.item.findMany({
      where: {
        type: "found",
        status: { in: ["unfound", "active"] },
        userId: { not: user.id }
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

    // Calculate match scores using the new matching algorithm
    const matchResults = await calculateBatchMatchScores(lostItem, foundItems);

    // Format results for the response
    const potentialMatches = matchResults.map((result) => {
      const foundItem = result.foundItem;
      
      // Parse location for display
      let foundLocation = foundItem.location;
      if (typeof foundLocation === "string") {
        try {
          foundLocation = JSON.parse(foundLocation);
        } catch (e) {
          foundLocation = {};
        }
      }

      // Parse lost item location for distance calculation
      let lostLocation = lostItem.location;
      if (typeof lostLocation === "string") {
        try {
          lostLocation = JSON.parse(lostLocation);
        } catch (e) {
          lostLocation = {};
        }
      }

      // Calculate distance in meters for display
      let distanceMeters = null;
      if (
        lostLocation?.latitude &&
        lostLocation?.longitude &&
        foundLocation?.latitude &&
        foundLocation?.longitude
      ) {
        distanceMeters = Math.round(
          calculateDistanceMeters(
            lostLocation.latitude,
            lostLocation.longitude,
            foundLocation.latitude,
            foundLocation.longitude
          )
        );
      }

      return {
        item: {
          id: foundItem.id.toString(),
          title: foundItem.title,
          name: foundItem.title, // For frontend compatibility
          description: foundItem.description,
          category: foundItem.category,
          location:
            foundLocation?.latitude && foundLocation?.longitude
              ? `${foundLocation.latitude.toFixed(4)}, ${foundLocation.longitude.toFixed(4)}`
              : "Unknown location",
          locationCoordinates: foundLocation?.latitude && foundLocation?.longitude
            ? { latitude: foundLocation.latitude, longitude: foundLocation.longitude }
            : null,
          timestamp: foundItem.timestamp.toISOString(),
          imageUrl: foundItem.imageUrls?.[0] || null,
          user: foundItem.user
        },
        score: result.finalScore, // Final weighted score (0-100%)
        breakdown: result.breakdown, // Individual scores (0-100% each)
        distanceMeters, // Distance in meters for display
        // Legacy fields for backwards compatibility (0-1 range)
        distanceScore: result.breakdown.locationScore / 100,
        timeScore: result.breakdown.timeScore / 100,
        similarityScore: result.breakdown.textSimilarityScore / 100
      };
    });

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

/**
 * Resolve the return method based on both users' preferences
 * Rules:
 * - If both choose "no_preference", use "in_person"
 * - If either chooses "local_lost_and_found", use "local_lost_and_found"
 * - If one prefers "in_person" and other "no_preference", use "in_person"
 */
const resolveReturnMethod = (lostPref, foundPref) => {
  // If either explicitly wants L&F, use L&F
  if (lostPref === "local_lost_and_found" || foundPref === "local_lost_and_found") {
    return "local_lost_and_found";
  }
  // Otherwise default to in-person (covers both no_preference, or in_person preference)
  return "in_person";
};

/**
 * Update a user's return method preference for a match
 */
const updatePreference = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);
    const { preference, returnLocation } = req.body;

    if (isNaN(matchId)) {
      return res.status(400).json({
        error: "Invalid match ID"
      });
    }

    // Validate preference
    const validPreferences = ["in_person", "local_lost_and_found", "no_preference"];
    if (!preference || !validPreferences.includes(preference)) {
      return res.status(400).json({
        error: "Invalid preference. Must be one of: in_person, local_lost_and_found, no_preference"
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

    // Determine which user is updating
    let updateData = {};
    const isLostUser = match.lostItem.userId === user.id;
    const isFoundUser = match.foundItem.userId === user.id;

    console.log("updatePreference debug:", {
      userId: user.id,
      lostItemUserId: match.lostItem.userId,
      foundItemUserId: match.foundItem.userId,
      isLostUser,
      isFoundUser,
      matchStatus: match.status
    });

    if (!isLostUser && !isFoundUser) {
      return res.status(403).json({
        error: "Not authorized to update preference for this match"
      });
    }

    if (isLostUser) {
      updateData.lostUserPreference = preference;
    } else {
      updateData.foundUserPreference = preference;
    }

    // If location is provided for L&F option, save it
    if (returnLocation && preference === "local_lost_and_found") {
      updateData.returnLocation = returnLocation;
    }

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData
    });

    // Check if both users have submitted preferences
    const lostPref = isLostUser ? preference : updatedMatch.lostUserPreference;
    const foundPref = isFoundUser ? preference : updatedMatch.foundUserPreference;

    if (lostPref && foundPref) {
      // Both have submitted - resolve the return method
      const resolvedMethod = resolveReturnMethod(lostPref, foundPref);
      
      await prisma.match.update({
        where: { id: matchId },
        data: {
          resolvedReturnMethod: resolvedMethod,
          status: "scheduling"
        }
      });

      // Notify both users about the resolved method
      const methodText = resolvedMethod === "local_lost_and_found" 
        ? "Lost & Found office pickup/drop-off" 
        : "in-person meeting";

      await createNotification(
        match.lostItem.userId,
        "method_resolved",
        "Return Method Confirmed",
        `Your item will be returned via ${methodText}.`,
        { matchId, resolvedMethod }
      );

      await createNotification(
        match.foundItem.userId,
        "method_resolved",
        "Return Method Confirmed",
        `The item will be returned via ${methodText}.`,
        { matchId, resolvedMethod }
      );
    } else {
      // Notify the other party that this user has submitted their preference
      const otherUserId = isLostUser ? match.foundItem.userId : match.lostItem.userId;
      
      await createNotification(
        otherUserId,
        "preference_submitted",
        "Return Preference Submitted",
        `${user.name} has submitted their return method preference. Please submit yours!`,
        { matchId }
      );
    }

    // Fetch and return the updated match
    const finalMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        foundItem: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        }
      }
    });

    res.json(finalMatch);
  } catch (error) {
    console.error("Update preference error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Internal server error while updating preference",
      details: error.message
    });
  }
};

/**
 * Get match status (for polling from waiting screen)
 */
const getMatchStatus = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);

    if (isNaN(matchId)) {
      return res.status(400).json({
        error: "Invalid match ID"
      });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        foundItem: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        }
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
        error: "Not authorized to view this match"
      });
    }

    // Return match with user role context
    const userRole = match.lostItem.userId === user.id ? "lost" : "found";
    const bothSubmitted = !!(match.lostUserPreference && match.foundUserPreference);
    const isResolved = !!match.resolvedReturnMethod;

    // Determine navigation target based on current state
    let navigationTarget = null;
    if (isResolved) {
      if (match.resolvedReturnMethod === "in_person") {
        navigationTarget = "contact_info";
      } else if (match.resolvedReturnMethod === "local_lost_and_found") {
        navigationTarget = "lost_and_found";
      }
    } else if (userRole === "lost" && match.lostUserPreference) {
      navigationTarget = "waiting";
    } else if (userRole === "found" && match.foundUserPreference) {
      navigationTarget = "waiting";
    } else {
      navigationTarget = "preference";
    }

    // Only reveal other party's identity if in-person method resolved
    const shouldRevealIdentity = match.resolvedReturnMethod === "in_person";
    const otherParty = userRole === "lost" ? match.foundItem.user : match.lostItem.user;

    res.json({
      id: match.id,
      status: match.status,
      lostUserPreference: match.lostUserPreference,
      foundUserPreference: match.foundUserPreference,
      resolvedReturnMethod: match.resolvedReturnMethod,
      returnLocation: match.returnLocation,
      notifiedAt: match.notifiedAt,
      userRole,
      bothSubmitted,
      isResolved,
      navigationTarget,
      // Only include contact info if in-person resolved
      otherPartyContact: shouldRevealIdentity ? {
        name: otherParty.name,
        email: otherParty.email,
        phone: otherParty.phone
      } : null
    });
  } catch (error) {
    console.error("Get match status error:", error);
    res.status(500).json({
      error: "Internal server error while fetching match status"
    });
  }
};

/**
 * Notify that the item has been dropped off at L&F (called by finder)
 */
const notifyReturn = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);
    const { locationId, locationName } = req.body;

    if (isNaN(matchId)) {
      return res.status(400).json({
        error: "Invalid match ID"
      });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        foundItem: true
      }
    });

    if (!match) {
      return res.status(404).json({
        error: "Match not found"
      });
    }

    // Only the finder (found item user) can notify about drop-off
    if (match.foundItem.userId !== user.id) {
      return res.status(403).json({
        error: "Only the finder can notify about item drop-off"
      });
    }

    // Update match with notification timestamp and location
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        notifiedAt: new Date(),
        returnLocation: locationId || locationName,
        status: "awaiting_pickup"
      }
    });

    // Notify the owner that their item has been dropped off
    await createNotification(
      match.lostItem.userId,
      "item_dropped_off",
      "Item Ready for Pickup!",
      `Your ${match.lostItem.title} has been dropped off at ${locationName || locationId}. Please pick it up at your earliest convenience.`,
      {
        matchId,
        locationId,
        locationName,
        itemTitle: match.lostItem.title
      }
    );

    res.json({
      success: true,
      message: "Owner has been notified about the drop-off",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Notify return error:", error);
    res.status(500).json({
      error: "Internal server error while notifying about return"
    });
  }
};

/**
 * Mark item as picked up / returned (called by owner after pickup)
 */
const completeReturn = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);

    if (isNaN(matchId)) {
      return res.status(400).json({
        error: "Invalid match ID"
      });
    }

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

    // Only the owner (lost item user) can mark as complete
    if (match.lostItem.userId !== user.id) {
      return res.status(403).json({
        error: "Only the owner can mark the item as returned"
      });
    }

    // Update match and item statuses
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "completed" }
    });

    await prisma.item.update({
      where: { id: match.lostItem.id },
      data: { status: "returned" }
    });

    await prisma.item.update({
      where: { id: match.foundItem.id },
      data: { status: "returned" }
    });

    // Notify the finder
    await createNotification(
      match.foundItem.userId,
      "item_returned",
      "Item Successfully Returned!",
      `The owner has picked up their item. Thank you for helping!`,
      { matchId }
    );

    res.json({
      success: true,
      message: "Item marked as returned successfully"
    });
  } catch (error) {
    console.error("Complete return error:", error);
    res.status(500).json({
      error: "Internal server error while completing return"
    });
  }
};

/**
 * Get claim details for finder review
 * Returns full details of the claim including claimant info
 */
const getClaimDetails = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);

    if (isNaN(matchId)) {
      return res.status(400).json({ error: "Invalid match ID" });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        foundItem: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Verify user is the finder (owns the found item)
    if (match.foundItem.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized to view this claim" });
    }

    // Determine current state for the finder - works for ALL statuses
    let finderState = "pending_review"; // Default: Finder needs to accept/decline
    
    if (match.status === "pending") {
      finderState = "pending_review";
    } else if (match.status === "declined") {
      finderState = "declined";
    } else if (match.status === "negotiating") {
      // Finder made a counter-proposal, waiting for claimant
      finderState = "awaiting_claimant_response";
    } else if (match.status === "accepted" || match.status === "scheduling") {
      if (!match.foundUserPreference) {
        finderState = "needs_preference"; // Finder accepted but hasn't selected preference
      } else if (!match.resolvedReturnMethod) {
        finderState = "awaiting_resolution"; // Both haven't submitted preferences yet
      } else if (match.resolvedReturnMethod === "local_lost_and_found" && !match.notifiedAt) {
        finderState = "needs_dropoff"; // Finder needs to drop off at L&F
      } else if (match.resolvedReturnMethod === "in_person") {
        finderState = "scheduling_meetup";
      } else {
        finderState = "awaiting_pickup";
      }
    } else if (match.status === "awaiting_pickup") {
      finderState = "awaiting_pickup";
    } else if (match.status === "completed") {
      finderState = "completed";
    }

    // Only reveal claimant identity if:
    // 1. Return method is resolved AND
    // 2. Return method is in_person (not L&F)
    const shouldRevealIdentity = match.resolvedReturnMethod === "in_person";

    res.json({
      match: {
        id: match.id,
        status: match.status,
        confidence: match.confidence,
        lostUserPreference: match.lostUserPreference,
        foundUserPreference: match.foundUserPreference,
        resolvedReturnMethod: match.resolvedReturnMethod,
        returnLocation: match.returnLocation,
        notifiedAt: match.notifiedAt,
        declineReason: match.declineReason,
        proposedReturnMethod: match.proposedReturnMethod,
        proposedLocation: match.proposedLocation,
        proposedLocationName: match.proposedLocationName,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt
      },
      // Only include full claimant info if in-person method resolved
      claimant: shouldRevealIdentity ? {
        id: match.lostItem.user.id,
        name: match.lostItem.user.name,
        email: match.lostItem.user.email,
        phone: match.lostItem.user.phone
      } : null,
      lostItem: {
        id: match.lostItem.id,
        title: match.lostItem.title,
        description: match.lostItem.description,
        category: match.lostItem.category,
        location: match.lostItem.location,
        timestamp: match.lostItem.timestamp,
        imageUrls: match.lostItem.imageUrls
      },
      foundItem: {
        id: match.foundItem.id,
        title: match.foundItem.title,
        description: match.foundItem.description
      },
      finderState
    });
  } catch (error) {
    console.error("Get claim details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Finder accepts a claim
 */
const acceptClaim = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);

    if (isNaN(matchId)) {
      return res.status(400).json({ error: "Invalid match ID" });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: { include: { user: true } },
        foundItem: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.foundItem.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized to accept this claim" });
    }

    // Handle already accepted or other non-pending states gracefully
    if (match.status !== "pending") {
      // Return current match state instead of error - claim already processed
      return res.json({
        success: true,
        message: `Claim already ${match.status}`,
        match: match,
        alreadyProcessed: true
      });
    }

    // Update match status to accepted
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "accepted",
        confirmedByFoundUser: true
      }
    });

    // Notify the claimant
    await createNotification(
      match.lostItem.userId,
      "claim_accepted",
      "Your Claim Was Accepted!",
      `${user.name} has confirmed that the ${match.foundItem.title} belongs to you. Please select your return preference.`,
      { matchId }
    );

    res.json({
      success: true,
      message: "Claim accepted successfully",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Accept claim error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Finder declines a claim
 */
const declineClaim = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);
    const { reason, message } = req.body;

    if (isNaN(matchId)) {
      return res.status(400).json({ error: "Invalid match ID" });
    }

    const validReasons = ["wrong_person", "suggest_alternative"];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ error: "Invalid decline reason" });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: { include: { user: true } },
        foundItem: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.foundItem.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized to decline this claim" });
    }

    // Update match and items
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "declined",
        declineReason: reason,
        declineMessage: message || null
      }
    });

    // Reset items to unfound state so they can be claimed again
    await Promise.all([
      prisma.item.update({
        where: { id: match.lostItemId },
        data: { status: "unfound" }
      }),
      prisma.item.update({
        where: { id: match.foundItemId },
        data: { status: "unfound" }
      })
    ]);

    // Notify the claimant
    await createNotification(
      match.lostItem.userId,
      "claim_declined",
      "Your Claim Was Declined",
      reason === "wrong_person" 
        ? `Unfortunately, ${user.name} believes the ${match.foundItem.title} doesn't match your lost item.`
        : `${user.name} has declined your claim and suggested an alternative arrangement.`,
      { matchId, reason, message }
    );

    res.json({
      success: true,
      message: "Claim declined",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Decline claim error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Finder proposes a counter-offer (new return method/location)
 */
const proposeAlternative = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);
    const { returnMethod, location, locationName, message } = req.body;

    if (isNaN(matchId)) {
      return res.status(400).json({ error: "Invalid match ID" });
    }

    const validMethods = ["in_person", "local_lost_and_found"];
    if (!returnMethod || !validMethods.includes(returnMethod)) {
      return res.status(400).json({ error: "Invalid return method" });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: { include: { user: true } },
        foundItem: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.foundItem.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Update match with proposal
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "negotiating",
        proposedReturnMethod: returnMethod,
        proposedLocation: location || null,
        proposedLocationName: locationName || null,
        declineReason: "suggest_alternative",
        declineMessage: message || null
      }
    });

    // Notify the claimant about the counter-proposal
    await createNotification(
      match.lostItem.userId,
      "counter_proposal",
      "New Return Proposal",
      `${user.name} has suggested a different way to return your ${match.lostItem.title}.`,
      { 
        matchId, 
        proposedReturnMethod: returnMethod,
        proposedLocation: location,
        proposedLocationName: locationName
      }
    );

    res.json({
      success: true,
      message: "Counter-proposal sent",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Propose alternative error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Claimant accepts finder's counter-proposal
 */
const acceptProposal = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);

    if (isNaN(matchId)) {
      return res.status(400).json({ error: "Invalid match ID" });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: true,
        foundItem: { include: { user: true } }
      }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Only claimant (lost item owner) can accept proposal
    if (match.lostItem.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (match.status !== "negotiating") {
      return res.status(400).json({ error: "No proposal to accept" });
    }

    // Accept the proposal - set resolved return method
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "scheduling",
        resolvedReturnMethod: match.proposedReturnMethod,
        returnLocation: match.proposedLocationName || match.proposedLocation,
        lostUserPreference: match.proposedReturnMethod,
        foundUserPreference: match.proposedReturnMethod
      }
    });

    // Notify finder
    await createNotification(
      match.foundItem.userId,
      "proposal_accepted",
      "Proposal Accepted!",
      `${user.name} has accepted your proposed return method for ${match.foundItem.title}.`,
      { matchId }
    );

    res.json({
      success: true,
      message: "Proposal accepted",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Accept proposal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Claimant rejects finder's counter-proposal
 */
const rejectProposal = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);

    if (isNaN(matchId)) {
      return res.status(400).json({ error: "Invalid match ID" });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        lostItem: true,
        foundItem: { include: { user: true } }
      }
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.lostItem.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Reject proposal - revert to pending for finder to reconsider
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "pending",
        proposedReturnMethod: null,
        proposedLocation: null,
        proposedLocationName: null,
        declineReason: null,
        declineMessage: null
      }
    });

    // Notify finder
    await createNotification(
      match.foundItem.userId,
      "proposal_rejected",
      "Proposal Declined",
      `${user.name} has declined your proposed return method. Please review the claim again.`,
      { matchId }
    );

    res.json({
      success: true,
      message: "Proposal rejected",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Reject proposal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get matches where user is the finder (found item owner)
 * Used for showing pending claims on My Found Items page
 */
const getClaimsForFinder = async (req, res) => {
  try {
    const user = req.user;

    const matches = await prisma.match.findMany({
      where: {
        foundItem: { userId: user.id }
      },
      include: {
        lostItem: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        foundItem: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(matches);
  } catch (error) {
    console.error("Get claims for finder error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get the active match for a lost item
 * Used to navigate to correct scheduling screen from lost item details
 */
const getMatchForLostItem = async (req, res) => {
  try {
    const user = req.user;
    const itemId = parseInt(req.params.itemId);

    if (isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    // Verify user owns this lost item
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (item.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get the active match for this lost item
    const match = await prisma.match.findFirst({
      where: {
        lostItemId: itemId,
        status: { notIn: ["declined", "completed"] }
      },
      include: {
        foundItem: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!match) {
      return res.status(404).json({ error: "No active match found for this item" });
    }

    // Determine navigation target
    let navigationTarget = "preference";
    if (match.resolvedReturnMethod) {
      if (match.resolvedReturnMethod === "in_person") {
        navigationTarget = "contact_info";
      } else {
        navigationTarget = "lost_and_found";
      }
    } else if (match.lostUserPreference) {
      navigationTarget = "waiting";
    }

    // Only reveal finder identity if in-person method resolved
    const shouldRevealIdentity = match.resolvedReturnMethod === "in_person";

    res.json({
      matchId: match.id,
      status: match.status,
      lostUserPreference: match.lostUserPreference,
      foundUserPreference: match.foundUserPreference,
      resolvedReturnMethod: match.resolvedReturnMethod,
      returnLocation: match.returnLocation,
      notifiedAt: match.notifiedAt,
      navigationTarget,
      finderContact: shouldRevealIdentity ? {
        name: match.foundItem.user.name,
        email: match.foundItem.user.email,
        phone: match.foundItem.user.phone
      } : null
    });
  } catch (error) {
    console.error("Get match for lost item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
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
};