const db = require('../config/db');
const { emitToProject, emitNotification } = require('../sockets/socketHandler');

const commentController = {
  getCommentsByTask: async (req, res, next) => {
    try {
      const taskId = req.params.taskId || req.params.id;

      const comments = await db.all(
        `SELECT cm.*, u.name as author_name, u.avatar_url as author_avatar, u.role as author_role
         FROM comments cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.task_id = ?
         ORDER BY cm.created_at ASC`,
        [taskId]
      );

      res.status(200).json({
        success: true,
        comments
      });
    } catch (error) {
      next(error);
    }
  },

  addComment: async (req, res, next) => {
    try {
      const { task_id, content } = req.body;
      const userId = req.user.id;

      if (!task_id || !content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task ID and comment content are required.'
        });
      }

      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [task_id]);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
      }

      const result = await db.run(
        'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
        [task_id, userId, content.trim()]
      );

      const commentId = result.lastID;

      // Log activity
      await db.run(
        `INSERT INTO activity_logs (task_id, project_id, user_id, action, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          task_id,
          task.project_id,
          userId,
          'COMMENT_ADDED',
          JSON.stringify({ taskTitle: task.title, commentSnippet: content.slice(0, 40) })
        ]
      );

      const createdComment = await db.get(
        `SELECT cm.*, u.name as author_name, u.avatar_url as author_avatar, u.role as author_role
         FROM comments cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.id = ?`,
        [commentId]
      );

      // Notify task assignee if different from commenter
      if (task.assignee_id && task.assignee_id !== userId) {
        const notif = await db.run(
          `INSERT INTO notifications (user_id, sender_id, title, message, type, link)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            task.assignee_id,
            userId,
            'New Comment on Task',
            `${req.user.name} commented on "${task.title}"`,
            'comment_added',
            `/projects/${task.project_id}?task=${task_id}`
          ]
        );

        emitNotification(task.assignee_id, {
          id: notif.lastID,
          title: 'New Comment on Task',
          message: `${req.user.name} commented on "${task.title}"`,
          type: 'comment_added',
          link: `/projects/${task.project_id}?task=${task_id}`,
          created_at: new Date().toISOString()
        });
      }

      // Emit real-time comment to project
      emitToProject(task.project_id, 'comment_added', {
        taskId: Number(task_id),
        comment: createdComment
      });

      res.status(201).json({
        success: true,
        message: 'Comment posted successfully.',
        comment: createdComment
      });
    } catch (error) {
      next(error);
    }
  },

  updateComment: async (req, res, next) => {
    try {
      const commentId = req.params.id;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
      }

      const comment = await db.get('SELECT * FROM comments WHERE id = ?', [commentId]);
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Comment not found.' });
      }

      if (comment.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only edit your own comments.' });
      }

      await db.run(
        'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [content.trim(), commentId]
      );

      const task = await db.get('SELECT project_id FROM tasks WHERE id = ?', [comment.task_id]);

      const updatedComment = await db.get(
        `SELECT cm.*, u.name as author_name, u.avatar_url as author_avatar, u.role as author_role
         FROM comments cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.id = ?`,
        [commentId]
      );

      if (task) {
        emitToProject(task.project_id, 'comment_updated', {
          taskId: comment.task_id,
          comment: updatedComment
        });
      }

      res.status(200).json({
        success: true,
        message: 'Comment updated.',
        comment: updatedComment
      });
    } catch (error) {
      next(error);
    }
  },

  deleteComment: async (req, res, next) => {
    try {
      const commentId = req.params.id;

      const comment = await db.get('SELECT * FROM comments WHERE id = ?', [commentId]);
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Comment not found.' });
      }

      if (comment.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
      }

      const task = await db.get('SELECT project_id FROM tasks WHERE id = ?', [comment.task_id]);

      await db.run('DELETE FROM comments WHERE id = ?', [commentId]);

      if (task) {
        emitToProject(task.project_id, 'comment_deleted', {
          taskId: comment.task_id,
          commentId: Number(commentId)
        });
      }

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = commentController;
