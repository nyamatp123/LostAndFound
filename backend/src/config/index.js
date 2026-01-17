require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 8000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "change_this_in_production",
  ACCESS_TOKEN_EXPIRE_MINUTES: 60 * 24 * 7, // 1 week in minutes
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
  NODE_ENV: process.env.NODE_ENV || "development"
};