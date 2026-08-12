const db = require('../config/db');
const { emitToProject, emitNotification } = require('../sockets/socketHandler');

const taskController = {
  // Get all tasks for a project with optional filters
  getTasksByProject: async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id;
      const { status, priority, assignee_id, search, due } = req.query;

      let sql = `
        SELECT t.*, 
          u.name as assignee_name, 
          u.email as assignee_email, 
          u.avatar_url as assignee_avatar,
          c.name as creator_name,
          (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users c ON t.creator_id = c.id
        WHERE t.project_id = ?
      `;

      const params = [projectId];

      if (status) {
        sql += ' AND t.status = ?';
        params.push(status);
      }

      if (priority) {
        sql += ' AND t.priority = ?';
        params.push(priority);
      }

      if (assignee_id) {
        if (assignee_id === 'unassigned') {
          sql += ' AND t.assignee_id IS NULL';
        } else {
          sql += ' AND t.assignee_id = ?';
          params.push(assignee_id);
        }
      }

      if (search && search.trim()) {
        sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
        const queryTerm = `%${search.trim()}%`;
        params.push(queryTerm, queryTerm);
      }

      if (due === 'overdue') {
        const today = new Date().toISOString().split('T')[0];
        sql += ' AND t.due_date IS NOT NULL AND t.due_date < ? AND t.status != "DONE"';
        params.push(today);
      }

      sql += ' ORDER BY t.order_index ASC, t.created_at DESC';

      const tasks = await db.all(sql, params);

      // Parse JSON labels
      const formattedTasks = tasks.map(task => ({
        ...task,
        labels: task.labels ? JSON.parse(task.labels) : []
      }));

      res.status(200).json({
        success: true,
        tasks: formattedTasks
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single task details with comments and activity
  getTaskById: async (req, res, next) => {
    try {
      const taskId = req.params.id;

      const task = await db.get(
        `SELECT t.*, 
          u.name as assignee_name, 
          u.email as assignee_email, 
          u.avatar_url as assignee_avatar,
          c.name as creator_name,
          c.avatar_url as creator_avatar,
          p.name as project_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users c ON t.creator_id = c.id
        WHERE t.id = ?`,
        [taskId]
      );

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
      }

      // Get comments
      const comments = await db.all(
        `SELECT cm.*, u.name as author_name, u.avatar_url as author_avatar, u.role as author_role
         FROM comments cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.task_id = ?
         ORDER BY cm.created_at ASC`,
        [taskId]
      );

      // Get task activity history
      const activities = await db.all(
        `SELECT a.*, u.name as user_name, u.avatar_url as user_avatar
         FROM activity_logs a
         JOIN users u ON a.user_id = u.id
         WHERE a.task_id = ?
         ORDER BY a.created_at DESC`,
        [taskId]
      );

      res.status(200).json({
        success: true,
        task: {
          ...task,
          labels: task.labels ? JSON.parse(task.labels) : [],
          comments,
          activities
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new task
  createTask: async (req, res, next) => {
    try {
      const {
        project_id,
        title,
        description = '',
        status = 'TODO',
        priority = 'Medium',
        assignee_id = null,
        due_date = null,
        labels = []
      } = req.body;

      if (!project_id || !title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Project ID and task title are required.'
        });
      }

      // Check max order_index for status
      const maxOrder = await db.get(
        'SELECT MAX(order_index) as max_idx FROM tasks WHERE project_id = ? AND status = ?',
        [project_id, status]
      );
      const nextIndex = (maxOrder && maxOrder.max_idx !== null) ? maxOrder.max_idx + 1 : 0;

      const labelsJson = JSON.stringify(Array.isArray(labels) ? labels : []);

      const result = await db.run(
        `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, creator_id, due_date, labels, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project_id,
          title.trim(),
          description,
          status,
          priority,
          assignee_id || null,
          req.user.id,
          due_date || null,
          labelsJson,
          nextIndex
        ]
      );

      const taskId = result.lastID;

      // Log activity
      await db.run(
        `INSERT INTO activity_logs (task_id, project_id, user_id, action, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          taskId,
          project_id,
          req.user.id,
          'TASK_CREATED',
          JSON.stringify({ taskTitle: title.trim(), status, priority })
        ]
      );

      // Fetch created task with joins
      const createdTask = await db.get(
        `SELECT t.*, 
          u.name as assignee_name, 
          u.email as assignee_email, 
          u.avatar_url as assignee_avatar,
          c.name as creator_name,
          0 as comment_count
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users c ON t.creator_id = c.id
        WHERE t.id = ?`,
        [taskId]
      );

      const formattedTask = {
        ...createdTask,
        labels: JSON.parse(createdTask.labels)
      };

      // Notify assignee if different from creator
      if (assignee_id && Number(assignee_id) !== req.user.id) {
        const notif = await db.run(
          `INSERT INTO notifications (user_id, sender_id, title, message, type, link)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            assignee_id,
            req.user.id,
            'New Task Assigned',
            `${req.user.name} assigned you to "${title.trim()}"`,
            'task_assigned',
            `/projects/${project_id}?task=${taskId}`
          ]
        );

        emitNotification(assignee_id, {
          id: notif.lastID,
          title: 'New Task Assigned',
          message: `${req.user.name} assigned you to "${title.trim()}"`,
          type: 'task_assigned',
          link: `/projects/${project_id}?task=${taskId}`,
          created_at: new Date().toISOString()
        });
      }

      // Emit real-time WebSocket update to project room
      emitToProject(project_id, 'task_created', formattedTask);

      res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        task: formattedTask
      });
    } catch (error) {
      next(error);
    }
  },

  // Update task details
  updateTask: async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const { title, description, priority, assignee_id, due_date, labels, status } = req.body;

      const currentTask = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!currentTask) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
      }

      const labelsJson = labels !== undefined ? JSON.stringify(Array.isArray(labels) ? labels : []) : currentTask.labels;

      await db.run(
        `UPDATE tasks 
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             priority = COALESCE(?, priority),
             assignee_id = ?,
             due_date = ?,
             labels = ?,
             status = COALESCE(?, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title !== undefined ? title.trim() : currentTask.title,
          description !== undefined ? description : currentTask.description,
          priority || currentTask.priority,
          assignee_id !== undefined ? (assignee_id || null) : currentTask.assignee_id,
          due_date !== undefined ? (due_date || null) : currentTask.due_date,
          labelsJson,
          status || currentTask.status,
          taskId
        ]
      );

      // Check assignee change notification
      if (assignee_id !== undefined && assignee_id !== currentTask.assignee_id && assignee_id && Number(assignee_id) !== req.user.id) {
        await db.run(
          `INSERT INTO notifications (user_id, sender_id, title, message, type, link)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            assignee_id,
            req.user.id,
            'Task Reassigned',
            `${req.user.name} assigned you to task "${title || currentTask.title}"`,
            'task_assigned',
            `/projects/${currentTask.project_id}?task=${taskId}`
          ]
        );

        emitNotification(assignee_id, {
          title: 'Task Reassigned',
          message: `${req.user.name} assigned you to task "${title || currentTask.title}"`,
          type: 'task_assigned',
          link: `/projects/${currentTask.project_id}?task=${taskId}`
        });
      }

      // Log activity
      await db.run(
        `INSERT INTO activity_logs (task_id, project_id, user_id, action, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          taskId,
          currentTask.project_id,
          req.user.id,
          'TASK_UPDATED',
          JSON.stringify({ taskTitle: title || currentTask.title })
        ]
      );

      const updatedTask = await db.get(
        `SELECT t.*, 
          u.name as assignee_name, 
          u.email as assignee_email, 
          u.avatar_url as assignee_avatar,
          c.name as creator_name,
          (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users c ON t.creator_id = c.id
        WHERE t.id = ?`,
        [taskId]
      );

      const formattedTask = {
        ...updatedTask,
        labels: JSON.parse(updatedTask.labels)
      };

      emitToProject(currentTask.project_id, 'task_updated', formattedTask);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully.',
        task: formattedTask
      });
    } catch (error) {
      next(error);
    }
  },

  // Fast Kanban status change & reordering
  updateTaskStatus: async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const { status, order_index } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'New status is required.' });
      }

      const currentTask = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!currentTask) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
      }

      const oldStatus = currentTask.status;

      await db.run(
        `UPDATE tasks 
         SET status = ?, 
             order_index = COALESCE(?, order_index),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, order_index !== undefined ? order_index : currentTask.order_index, taskId]
      );

      // Log status transition activity
      await db.run(
        `INSERT INTO activity_logs (task_id, project_id, user_id, action, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          taskId,
          currentTask.project_id,
          req.user.id,
          'STATUS_CHANGED',
          JSON.stringify({ from: oldStatus, to: status, taskTitle: currentTask.title })
        ]
      );

      // Notify task assignee if someone else moved it
      if (currentTask.assignee_id && currentTask.assignee_id !== req.user.id) {
        await db.run(
          `INSERT INTO notifications (user_id, sender_id, title, message, type, link)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            currentTask.assignee_id,
            req.user.id,
            'Task Status Updated',
            `${req.user.name} moved "${currentTask.title}" to ${status}`,
            'status_changed',
            `/projects/${currentTask.project_id}?task=${taskId}`
          ]
        );

        emitNotification(currentTask.assignee_id, {
          title: 'Task Status Updated',
          message: `${req.user.name} moved "${currentTask.title}" to ${status}`,
          type: 'status_changed',
          link: `/projects/${currentTask.project_id}?task=${taskId}`
        });
      }

      const updatedTask = await db.get(
        `SELECT t.*, 
          u.name as assignee_name, 
          u.email as assignee_email, 
          u.avatar_url as assignee_avatar,
          c.name as creator_name,
          (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users c ON t.creator_id = c.id
        WHERE t.id = ?`,
        [taskId]
      );

      const formattedTask = {
        ...updatedTask,
        labels: JSON.parse(updatedTask.labels)
      };

      emitToProject(currentTask.project_id, 'task_status_changed', formattedTask);

      res.status(200).json({
        success: true,
        message: 'Task status updated.',
        task: formattedTask
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete task
  deleteTask: async (req, res, next) => {
    try {
      const taskId = req.params.id;

      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
      }

      await db.run('DELETE FROM tasks WHERE id = ?', [taskId]);

      // Log activity
      await db.run(
        `INSERT INTO activity_logs (project_id, user_id, action, details)
         VALUES (?, ?, ?, ?)`,
        [
          task.project_id,
          req.user.id,
          'TASK_DELETED',
          JSON.stringify({ taskTitle: task.title })
        ]
      );

      emitToProject(task.project_id, 'task_deleted', {
        taskId: Number(taskId),
        projectId: task.project_id
      });

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = taskController;
