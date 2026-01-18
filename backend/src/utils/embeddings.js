const { GoogleGenerativeAI } = require("@google/generative-ai");

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  return new GoogleGenerativeAI(apiKey);
};

/**
 * Generate text embedding from description using Gemini embeddings.
 */
const generateTextEmbedding = async (text) => {
  const input = `${text || ""}`.trim();
  if (!input) {
    throw new Error("Text is required to generate an embedding");
  }

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(input);

  return result.embedding.values;
};

/**
 * Generate image embedding from image data
 * NOTE: This is a placeholder. In production, use CLIP or similar vision model
 */
const generateImageEmbedding = async (imageData) => {
  // Placeholder: returns random 384-dimensional vector
  // In production, use CLIP or similar model
  
  return Array(384).fill(0).map(() => Math.random());
};

module.exports = {
  generateTextEmbedding,
  generateImageEmbedding
};
