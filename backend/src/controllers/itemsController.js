const { prisma } = require("../database/prisma");
const { generateTextEmbedding, generateImageEmbedding } = require("../utils/embeddings");
const { cosineSim, jaccardSim } = require("../utils/similarity");
const { createNotification } = require("../utils/notifications");

/**
 * Create a new lost or found item
 */
const createItem = async (req, res) => {
  try {
    const user = req.user;
    const {
      type,
      title,
      description,
      category,
      attributes,
      location,
      timestamp,
      images
    } = req.body;

    // Validation
    if (!type || !title || !description || !category) {
      return res.status(400).json({
        error: "Missing required fields: type, title, description, category"
      });
    }

    if (!["lost", "found"].includes(type)) {
      return res.status(400).json({
        error: "Type must be either 'lost' or 'found'"
      });
    }

    // Generate text embedding
    const textEmbedding = await generateTextEmbedding(description);

    // Process images and generate embeddings
    const imageEmbeddings = [];
    const imageUrls = [];

    if (images && Array.isArray(images) && images.length > 0) {
      for (const imageBase64 of images) {
        try {
          const buffer = Buffer.from(imageBase64, "base64");
          const embedding = await generateImageEmbedding(buffer);
          imageEmbeddings.push(embedding);
          imageUrls.push(imageBase64); // Store base64 for now
        } catch (err) {
          console.error("Error processing image:", err);
        }
      }
    }

    // Check for duplicate items (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentItems = await prisma.item.findMany({
      where: {
        userId: user.id,
        category,
        type,
        createdAt: { gte: oneDayAgo }
      }
    });

    // Check similarity with recent items
    for (const recentItem of recentItems) {
      const similarity = cosineSim(textEmbedding, recentItem.textEmbedding);
      if (similarity > 0.95) {
        return res.status(400).json({
          error: "You posted a very similar item recently. Please wait before posting duplicates."
        });
      }
    }

    // Create the item
    const newItem = await prisma.item.create({
      data: {
        userId: user.id,
        type,
        title,
        description,
        category,
        attributes: attributes || {},
        location: location || {},
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        textEmbedding,
        imageEmbeddings,
        imageUrls,
        status: "unfound"
      }
    });

    // Find potential matches
    const oppositeType = type === "lost" ? "found" : "lost";
    const candidates = await prisma.item.findMany({
      where: {
        type: oppositeType,
        category,
        status: { in: ["unfound", "active"] },
        id: { not: newItem.id }
      }
    });

    // Calculate similarity and create matches
    for (const candidate of candidates) {
      const textSimilarity = cosineSim(textEmbedding, candidate.textEmbedding);
      const attrSimilarity = jaccardSim(
        attributes || {},
        candidate.attributes || {}
      );

      // Weighted confidence score
      const confidence = 0.6 * textSimilarity + 0.4 * attrSimilarity;

      // Create match if confidence is high enough
      if (confidence >= 0.75) {
        const match = await prisma.match.create({
          data: {
            lostItemId: type === "lost" ? newItem.id : candidate.id,
            foundItemId: type === "found" ? newItem.id : candidate.id,
            confidence,
            breakdown: {
              textSimilarity,
              attrSimilarity
            },
            explanation: `Potential match found with ${Math.round(confidence * 100)}% confidence based on description and attributes.`
          }
        });

        // Notify both users
        await createNotification(
          user.id,
          "match_found",
          "Potential Match Found!",
          `We found a potential match for your ${type} item "${title}".`,
          { matchId: match.id, itemId: newItem.id }
        );

        await createNotification(
          candidate.userId,
          "match_found",
          "Potential Match Found!",
          `We found a potential match for your ${candidate.type} item "${candidate.title}".`,
          { matchId: match.id, itemId: candidate.id }
        );
      }
    }

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Create item error:", error);
    res.status(500).json({
      error: "Internal server error while creating item"
    });
  }
};

/**
 * Get all items for current user
 */
const getUserItems = async (req, res) => {
  try {
    const user = req.user;
    const { type, status } = req.query;

    const where = { userId: user.id };

    if (type && ["lost", "found"].includes(type)) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    res.json(items);
  } catch (error) {
    console.error("Get user items error:", error);
    res.status(500).json({
      error: "Internal server error while fetching items"
    });
  }
};

/**
 * Get single item by ID
 */
const getItemById = async (req, res) => {
  try {
    const user = req.user;
    const itemId = parseInt(req.params.id);

    if (isNaN(itemId)) {
      return res.status(400).json({
        error: "Invalid item ID"
      });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
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

    if (!item) {
      return res.status(404).json({
        error: "Item not found"
      });
    }

    // Only owner can see full details
    if (item.userId !== user.id) {
      return res.status(403).json({
        error: "Not authorized to view this item"
      });
    }

    res.json(item);
  } catch (error) {
    console.error("Get item by ID error:", error);
    res.status(500).json({
      error: "Internal server error while fetching item"
    });
  }
};

/**
 * Update item status
 */
const updateItemStatus = async (req, res) => {
  try {
    const user = req.user;
    const itemId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(itemId)) {
      return res.status(400).json({
        error: "Invalid item ID"
      });
    }

    if (!status || !["unfound", "found", "matched", "returned"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'unfound', 'found', 'matched', or 'returned'"
      });
    }

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
        error: "Not authorized to update this item"
      });
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: { status }
    });

    res.json(updatedItem);
  } catch (error) {
    console.error("Update item status error:", error);
    res.status(500).json({
      error: "Internal server error while updating item"
    });
  }
};

/**
 * Delete an item
 */
const deleteItem = async (req, res) => {
  try {
    const user = req.user;
    const itemId = parseInt(req.params.id);

    if (isNaN(itemId)) {
      return res.status(400).json({
        error: "Invalid item ID"
      });
    }

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
        error: "Not authorized to delete this item"
      });
    }

    // Delete associated matches first
    await prisma.match.deleteMany({
      where: {
        OR: [
          { lostItemId: itemId },
          { foundItemId: itemId }
        ]
      }
    });

    // Delete the item
    await prisma.item.delete({
      where: { id: itemId }
    });

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({
      error: "Internal server error while deleting item"
    });
  }
};

/**
 * Get all found items for current user with claim status
 * Returns items with their active claim information for the finder dashboard
 */
const getFoundItemsWithClaimStatus = async (req, res) => {
  try {
    const user = req.user;

    // Get all found items for this user
    const foundItems = await prisma.item.findMany({
      where: {
        userId: user.id,
        type: "found"
      },
      orderBy: { createdAt: "desc" }
    });

    // Get all matches for these found items
    const itemIds = foundItems.map(item => item.id);
    const matches = await prisma.match.findMany({
      where: {
        foundItemId: { in: itemIds }
      },
      include: {
        lostItem: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Create a map of item ID to its claim info
    const claimMap = new Map();
    for (const match of matches) {
      const itemId = match.foundItemId;
      // If no existing claim or this is a more recent/active one
      if (!claimMap.has(itemId)) {
        claimMap.set(itemId, match);
      } else {
        // Prefer pending or active claims over completed/declined
        const existing = claimMap.get(itemId);
        const activeStatuses = ["pending", "accepted", "negotiating", "scheduling", "awaiting_pickup"];
        if (activeStatuses.includes(match.status) && !activeStatuses.includes(existing.status)) {
          claimMap.set(itemId, match);
        }
      }
    }

    // Map claim status to display status
    const getClaimDisplayStatus = (match) => {
      if (!match) return "unclaimed";
      switch (match.status) {
        case "pending": return "claim_pending";
        case "accepted": 
        case "scheduling": return "accepted";
        case "negotiating": return "negotiating";
        case "awaiting_pickup": return "awaiting_pickup";
        case "completed": return "returned";
        case "declined": return "declined";
        default: return "unclaimed";
      }
    };

    // Combine items with their claim status
    const itemsWithStatus = foundItems.map(item => {
      const claim = claimMap.get(item.id);
      return {
        ...item,
        claimStatus: getClaimDisplayStatus(claim),
        activeClaim: claim ? {
          matchId: claim.id,
          status: claim.status,
          claimantName: claim.lostItem?.user?.name || "Unknown",
          claimantId: claim.lostItem?.user?.id,
          resolvedReturnMethod: claim.resolvedReturnMethod,
          notifiedAt: claim.notifiedAt,
          createdAt: claim.createdAt,
          updatedAt: claim.updatedAt
        } : null
      };
    });

    res.json(itemsWithStatus);
  } catch (error) {
    console.error("Get found items with claim status error:", error);
    res.status(500).json({
      error: "Internal server error while fetching items"
    });
  }
};

/**
 * Update claim/match details (location, method) - finder action
 * Allows finder to update meetup details if item not yet returned
 */
const updateClaimDetails = async (req, res) => {
  try {
    const user = req.user;
    const matchId = parseInt(req.params.matchId);
    const { returnLocation, returnLocationName, returnMethod } = req.body;

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

    // Only finder can update claim details
    if (match.foundItem.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized to update this claim" });
    }

    // Cannot update if already completed
    if (match.status === "completed") {
      return res.status(400).json({ error: "Cannot update a completed claim" });
    }

    const updateData = {};
    
    if (returnLocation) {
      updateData.returnLocation = returnLocation;
    }
    
    if (returnLocationName) {
      updateData.proposedLocationName = returnLocationName;
    }
    
    if (returnMethod && ["in_person", "local_lost_and_found"].includes(returnMethod)) {
      updateData.resolvedReturnMethod = returnMethod;
      updateData.foundUserPreference = returnMethod;
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData
    });

    // Notify the claimant about the update
    await createNotification(
      match.lostItem.userId,
      "claim_updated",
      "Return Details Updated",
      `${user.name} has updated the return details for ${match.foundItem.title}.`,
      { matchId }
    );

    res.json({
      success: true,
      message: "Claim details updated successfully",
      match: updatedMatch
    });
  } catch (error) {
    console.error("Update claim details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createItem,
  getUserItems,
  getItemById,
  updateItemStatus,
  deleteItem,
  getFoundItemsWithClaimStatus,
  updateClaimDetails
};