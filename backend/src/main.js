const express = require("express");
const cors = require("cors");
const { PORT, NODE_ENV } = require("./config");
const { connectDB, disconnectDB } = require("./database/prisma");

// Import routes
const authRoutes = require("./routes/auth");
const itemsRoutes = require("./routes/items");
const matchesRoutes = require("./routes/matches");
const notificationsRoutes = require("./routes/notifications");

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging in development
if (NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/notifications", notificationsRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "running",
    service: "Campus Lost & Found API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    error: "Internal server error",
    message: NODE_ENV === "development" ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║  Campus Lost & Found API                   ║
║  Status: Running ✅                        ║
║  Port: ${PORT}                              ║
║  Environment: ${NODE_ENV}                  ║
║  URL: http://localhost:${PORT}             ║
╚════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        console.log("HTTP server closed");
        await disconnectDB();
        console.log("Shutdown complete");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", async (error) => {
      console.error("💥 Uncaught Exception:", error);
      await disconnectDB();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", async (reason, promise) => {
      console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
      await disconnectDB();
      process.exit(1);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();