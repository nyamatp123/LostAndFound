const { prisma } = require("../database/prisma");

/**
 * Get all notifications for current user
 */
const getNotifications = async (req, res) => {
  try {
    const user = req.user;
    const { limit = 50, unreadOnly = false } = req.query;

    const where = { userId: user.id };

    if (unreadOnly === "true") {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parseInt(limit)
    });

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      error: "Internal server error while fetching notifications"
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const user = req.user;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        error: "Invalid notification ID"
      });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    if (notification.userId !== user.id) {
      return res.status(403).json({
        error: "Not authorized to update this notification"
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      error: "Internal server error while updating notification"
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const user = req.user;

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false
      },
      data: { read: true }
    });

    res.json({ 
      success: true, 
      message: "All notifications marked as read",
      count: result.count
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      error: "Internal server error while updating notifications"
    });
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const user = req.user;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        error: "Invalid notification ID"
      });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    if (notification.userId !== user.id) {
      return res.status(403).json({
        error: "Not authorized to delete this notification"
      });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({ 
      success: true, 
      message: "Notification deleted successfully" 
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      error: "Internal server error while deleting notification"
    });
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const user = req.user;

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      error: "Internal server error while fetching unread count"
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};