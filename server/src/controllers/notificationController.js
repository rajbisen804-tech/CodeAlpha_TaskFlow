const db = require('../config/db');

const notificationController = {
  getUserNotifications: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const notifications = await db.all(
        `SELECT n.*, u.name as sender_name, u.avatar_url as sender_avatar
         FROM notifications n
         LEFT JOIN users u ON n.sender_id = u.id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT 50`,
        [userId]
      );

      const unreadCount = await db.get(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      res.status(200).json({
        success: true,
        unreadCount: unreadCount ? unreadCount.count : 0,
        notifications
      });
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const notifId = req.params.id;
      const userId = req.user.id;

      await db.run(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notifId, userId]
      );

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.'
      });
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;

      await db.run(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [userId]
      );

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.'
      });
    } catch (error) {
      next(error);
    }
  },

  deleteNotification: async (req, res, next) => {
    try {
      const notifId = req.params.id;
      const userId = req.user.id;

      await db.run(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [notifId, userId]
      );

      res.status(200).json({
        success: true,
        message: 'Notification deleted.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = notificationController;
