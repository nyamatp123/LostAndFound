const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Test database connection
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

// Disconnect from database
const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log("📦 Database disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting from database:", error);
  }
};

module.exports = { prisma, connectDB, disconnectDB };