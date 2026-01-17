const { Router } = require("express");
const { authMiddleware } = require("../auth/middleware");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require("../controllers/notificationsController");

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/notifications - Get all notifications
router.get("/", getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get("/unread-count", getUnreadCount);

// POST /api/notifications/mark-all-read - Mark all as read
router.post("/mark-all-read", markAllAsRead);

// POST /api/notifications/:id/read - Mark single as read
router.post("/:id/read", markAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", deleteNotification);

module.exports = router;