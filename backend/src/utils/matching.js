const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config");

// Weight constants for final score calculation
const WEIGHTS = {
  TIME: 0.15,
  LOCATION: 0.25,
  TEXT_SIMILARITY: 0.6,
};

// Initialize Gemini AI
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Calculate time matching score (0-100)
 * 
 * SCALE: Returns 0-100 directly (percentage).
 *
 * Case A: Found time is BEFORE lost time (reporting delay allowed up to 12 hours)
 *   - 0 hours difference -> 100
 *   - 12 hours difference -> 0
 *   - >12 hours -> 0
 * 
 * Case B: Found time is AFTER lost time (expected case, up to 7 days)
 *   - 0 hours difference -> 100
 *   - 168 hours (7 days) difference -> 0
 *   - >168 hours -> 0
 *
 * @param {Date|string} lostTime - When the item was lost
 * @param {Date|string} foundTime - When the item was found
 * @returns {number} Score between 0 and 100 (percentage)
 */
const calculateTimeScore = (lostTime, foundTime) => {
  const lostDate = new Date(lostTime);
  const foundDate = new Date(foundTime);

  // Calculate difference in milliseconds
  const diffMs = foundDate.getTime() - lostDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  let score;

  if (diffHours < 0) {
    // Case A: Found time is BEFORE lost time (reporting delay)
    const hoursDifference = Math.abs(diffHours);

    if (hoursDifference <= 12) {
      // Linear decrease from 100 to 0 over 12 hours
      score = 100 - (hoursDifference / 12) * 100;
    } else {
      score = 0;
    }
  } else {
    // Case B: Found time is AFTER lost time (expected case)
    const hoursDifference = diffHours;
    const maxHours = 168; // 7 days

    if (hoursDifference <= maxHours) {
      // Linear decrease from 100 to 0 over 168 hours
      score = 100 - (hoursDifference / maxHours) * 100;
    } else {
      score = 0;
    }
  }

  // SCALE: 0-100 (percentage)
  return clamp(score, 0, 100);
};

/**
 * Calculate location matching score (0-100)
 * 
 * SCALE: Returns 0-100 directly (percentage).
 *
 * 0-200m: score = 100
 * 200m-4000m: linear decrease from 100 to 0
 * 4000m+: score = 0
 *
 * @param {number} lostLat - Latitude where item was lost
 * @param {number} lostLon - Longitude where item was lost
 * @param {number} foundLat - Latitude where item was found
 * @param {number} foundLon - Longitude where item was found
 * @returns {number} Score between 0 and 100 (percentage)
 */
const calculateLocationScore = (lostLat, lostLon, foundLat, foundLon) => {
  // If any coordinate is missing, return neutral score
  if (
    lostLat == null ||
    lostLon == null ||
    foundLat == null ||
    foundLon == null
  ) {
    return 50; // Neutral score (50%) when location data is unavailable
  }

  const distanceMeters = calculateDistanceMeters(
    lostLat,
    lostLon,
    foundLat,
    foundLon
  );

  let score;

  if (distanceMeters <= 200) {
    // Within 200m: perfect score
    score = 100;
  } else if (distanceMeters <= 4000) {
    // Between 200m and 4000m: linear decrease from 100 to 0
    const range = 4000 - 200; // 3800m
    const distanceInRange = distanceMeters - 200;
    score = 100 - (distanceInRange / range) * 100;
  } else {
    // Beyond 4km: minimum score
    score = 0;
  }

  // SCALE: 0-100 (percentage)
  return clamp(score, 0, 100);
};

/**
 * Calculate text similarity score using Gemini API (0-100)
 * 
 * SCALE: Returns 0-100 directly (percentage).
 * 
 * This function evaluates whether two item descriptions refer to the SAME
 * PHYSICAL OBJECT, not just similar items. It uses structured criteria:
 * - Object type (phone, wallet, keys, etc.)
 * - Specific model/version (iPhone 14 vs iPhone 11)
 * - Color
 * - Distinctive features (cases, stickers, damage, patterns)
 *
 * @param {string} lostName - Name of the lost item
 * @param {string} lostDescription - Description of the lost item
 * @param {string} foundName - Name of the found item
 * @param {string} foundDescription - Description of the found item
 * @returns {Promise<number>} Score between 0 and 100 (percentage)
 */
const calculateTextSimilarityScore = async (
  lostName,
  lostDescription,
  foundName,
  foundDescription
) => {
  // If Gemini is not configured, return a neutral score
  if (!genAI) {
    console.warn("Gemini API not configured. Using fallback text similarity.");
    return calculateFallbackTextSimilarity(
      lostName,
      lostDescription,
      foundName,
      foundDescription
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are given two items:

LOST ITEM:
Name: ${lostName || "Not provided"}
Description: ${lostDescription || "Not provided"}

FOUND ITEM:
Name: ${foundName || "Not provided"}
Description: ${foundDescription || "Not provided"}

Your task is to determine how likely it is that these two entries refer to the SAME PHYSICAL OBJECT, not just similar items.

OUTPUT: Return one integer from 1 to 10 representing your confidence.
- 10 = almost certainly the same physical object
- 1 = clearly not the same object
Return ONLY the number. No explanation.

HOW TO EVALUATE:
Focus on object identity, not wording.

Consider:
- Object type (e.g., phone, wallet, keys)
- Specific model or version (e.g., iPhone 14 vs iPhone 11)
- Color
- Distinctive features (cases, stickers, damage, patterns, accessories)

Ignore:
- Word order
- Minor wording differences
- Synonyms and paraphrases
Treat rephrased descriptions as equivalent if they describe the same attributes.

SCORING RULES (STRICT):

9-10: Same object type AND same specific model/version AND matching color or matching distinctive features. Minor wording or ordering differences are acceptable.

7-8: Same object type AND same model/version BUT missing one secondary detail (color OR distinctive feature).

4-6: Same object type BUT different model/version OR very few shared identifying details.

1-3: Different object types OR clearly describe different items.

IMPORTANT:
- Do NOT be conservative.
- If a human would reasonably believe these describe the same object, score 9 or higher.
- Exact phrasing is irrelevant; meaning is what matters.
- Model/version matches should be weighted heavily.

Your response must be ONLY a single integer between 1 and 10.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse the response as a number (1-10 scale from Gemini)
    const rawScore = parseInt(text, 10);

    if (isNaN(rawScore) || rawScore < 1 || rawScore > 10) {
      console.warn(
        `Gemini returned invalid score: "${text}". Using fallback.`
      );
      return calculateFallbackTextSimilarity(
        lostName,
        lostDescription,
        foundName,
        foundDescription
      );
    }

    // Convert 1-10 scale to 0-100 percentage
    // 1 -> 0%, 10 -> 100%
    const percentageScore = ((rawScore - 1) / 9) * 100;
    
    // SCALE: Return 0-100 (percentage)
    return Math.round(percentageScore);
  } catch (error) {
    console.error("Gemini API error:", error.message);
    return calculateFallbackTextSimilarity(
      lostName,
      lostDescription,
      foundName,
      foundDescription
    );
  }
};

/**
 * Fallback text similarity calculation using simple word matching
 * Used when Gemini API is not available
 * 
 * SCALE: Returns 0-100 directly (percentage).
 *
 * @param {string} lostName
 * @param {string} lostDescription
 * @param {string} foundName
 * @param {string} foundDescription
 * @returns {number} Score between 0 and 100 (percentage)
 */
const calculateFallbackTextSimilarity = (
  lostName,
  lostDescription,
  foundName,
  foundDescription
) => {
  const lostText = `${lostName || ""} ${lostDescription || ""}`.toLowerCase();
  const foundText = `${foundName || ""} ${foundDescription || ""}`.toLowerCase();

  // Extract words (removing common stop words)
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "it",
    "its",
    "my",
    "i",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "and",
    "or",
    "with",
    "has",
    "have",
    "had",
  ]);

  const extractWords = (text) => {
    return text
      .split(/\s+/)
      .map((word) => word.replace(/[^a-z0-9]/g, ""))
      .filter((word) => word.length > 2 && !stopWords.has(word));
  };

  const lostWords = new Set(extractWords(lostText));
  const foundWords = new Set(extractWords(foundText));

  if (lostWords.size === 0 || foundWords.size === 0) {
    return 50; // Neutral score (50%) when no meaningful words
  }

  // Calculate Jaccard similarity (0-1)
  const intersection = [...lostWords].filter((word) => foundWords.has(word));
  const union = new Set([...lostWords, ...foundWords]);
  const jaccardScore = intersection.length / union.size;

  // SCALE: Convert Jaccard (0-1) to percentage (0-100)
  return clamp(Math.round(jaccardScore * 100), 0, 100);
};

/**
 * Calculate the final weighted match score between a lost and found item
 * 
 * SCALE: All scores are 0-100 (percentage).
 * Final score = weighted sum of individual scores (also 0-100).
 * 
 * DO NOT multiply, divide, or convert the final score.
 * It is already a percentage ready for display.
 *
 * @param {Object} lostItem - The lost item
 * @param {Object} foundItem - The found item
 * @returns {Promise<Object>} Match result with final score and breakdown (all 0-100)
 */
const calculateMatchScore = async (lostItem, foundItem) => {
  // Parse locations
  let lostLocation = lostItem.location;
  let foundLocation = foundItem.location;

  if (typeof lostLocation === "string") {
    try {
      lostLocation = JSON.parse(lostLocation);
    } catch (e) {
      lostLocation = {};
    }
  }

  if (typeof foundLocation === "string") {
    try {
      foundLocation = JSON.parse(foundLocation);
    } catch (e) {
      foundLocation = {};
    }
  }

  // Calculate individual scores (each returns 0-100)
  const timeScore = calculateTimeScore(lostItem.timestamp, foundItem.timestamp);

  const locationScore = calculateLocationScore(
    lostLocation?.latitude,
    lostLocation?.longitude,
    foundLocation?.latitude,
    foundLocation?.longitude
  );

  const textScore = await calculateTextSimilarityScore(
    lostItem.title,
    lostItem.description,
    foundItem.title,
    foundItem.description
  );

  // Calculate final weighted score
  // Since each score is 0-100 and weights sum to 1.0, result is also 0-100
  const finalScore =
    timeScore * WEIGHTS.TIME +
    locationScore * WEIGHTS.LOCATION +
    textScore * WEIGHTS.TEXT_SIMILARITY;

  // DEBUG: Print scores to terminal
  console.log('\n📊 MATCH SCORE BREAKDOWN:');
  console.log(`   Lost: "${lostItem.title}" vs Found: "${foundItem.title}"`);
  console.log(`   ├─ Time Score:     ${timeScore.toFixed(1)}% (weight: ${WEIGHTS.TIME})`);
  console.log(`   ├─ Location Score: ${locationScore.toFixed(1)}% (weight: ${WEIGHTS.LOCATION})`);
  console.log(`   ├─ Text Score:     ${textScore.toFixed(1)}% (weight: ${WEIGHTS.TEXT_SIMILARITY})`);
  console.log(`   └─ FINAL SCORE:    ${finalScore.toFixed(1)}%`);

  // SCALE: 0-100 (percentage) - NO further conversion needed
  return {
    finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
    breakdown: {
      timeScore: Math.round(timeScore * 100) / 100, // Already 0-100
      locationScore: Math.round(locationScore * 100) / 100, // Already 0-100
      textSimilarityScore: Math.round(textScore * 100) / 100, // Already 0-100
    },
    weights: WEIGHTS,
  };
};

/**
 * Calculate match scores for multiple found items against a single lost item
 * Optimized for batch processing
 *
 * @param {Object} lostItem - The lost item
 * @param {Array} foundItems - Array of found items
 * @returns {Promise<Array>} Array of match results sorted by score (highest first)
 */
const calculateBatchMatchScores = async (lostItem, foundItems) => {
  const results = [];

  for (const foundItem of foundItems) {
    const matchResult = await calculateMatchScore(lostItem, foundItem);
    results.push({
      foundItem,
      ...matchResult,
    });
  }

  // Sort by final score (highest first)
  results.sort((a, b) => b.finalScore - a.finalScore);

  return results;
};

module.exports = {
  calculateTimeScore,
  calculateLocationScore,
  calculateTextSimilarityScore,
  calculateMatchScore,
  calculateBatchMatchScores,
  calculateDistanceMeters,
  WEIGHTS,
};
