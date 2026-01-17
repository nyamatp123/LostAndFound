/**
 * Calculate cosine similarity between two vectors
 */
const cosineSim = (vec1, vec2) => {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
};

/**
 * Calculate Jaccard similarity between two objects
 */
const jaccardSim = (obj1, obj2) => {
  const set1 = new Set(
    Object.entries(obj1).map(([key, val]) => `${key}:${val}`)
  );
  const set2 = new Set(
    Object.entries(obj2).map(([key, val]) => `${key}:${val}`)
  );

  const intersection = new Set(
    [...set1].filter(x => set2.has(x))
  );
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
};

module.exports = {
  cosineSim,
  jaccardSim
};