const { prisma } = require("../database/prisma");

/**
 * Create a notification for a user
 */
const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {}
      }
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

module.exports = { createNotification };