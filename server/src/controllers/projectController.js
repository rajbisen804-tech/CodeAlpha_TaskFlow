const db = require('../config/db');
const { emitToProject, emitNotification } = require('../sockets/socketHandler');

const projectController = {
  // Get all projects for current user
  getAllProjects: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const projects = await db.all(
        `SELECT DISTINCT p.*, 
          u.name as owner_name, 
          u.email as owner_email, 
          u.avatar_url as owner_avatar,
          pm.role as user_role,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'DONE') as completed_tasks,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
        WHERE p.owner_id = ? OR pm.user_id = ?
        ORDER BY p.updated_at DESC`,
        [userId, userId, userId]
      );

      // Fetch member avatars for each project
      for (const proj of projects) {
        const members = await db.all(
          `SELECT u.id, u.name, u.email, u.avatar_url, pm.role 
           FROM project_members pm
           JOIN users u ON pm.user_id = u.id
           WHERE pm.project_id = ?
           LIMIT 5`,
          [proj.id]
        );
        proj.members = members;
      }

      res.status(200).json({
        success: true,
        projects
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single project details
  getProjectById: async (req, res, next) => {
    try {
      const projectId = req.params.id;

      const project = await db.get(
        `SELECT p.*, u.name as owner_name, u.email as owner_email, u.avatar_url as owner_avatar
         FROM projects p
         JOIN users u ON p.owner_id = u.id
         WHERE p.id = ?`,
        [projectId]
      );

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }

      const members = await db.all(
        `SELECT u.id, u.name, u.email, u.avatar_url, u.role as user_title, pm.role as project_role, pm.joined_at
         FROM project_members pm
         JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = ?
         ORDER BY pm.joined_at ASC`,
        [projectId]
      );

      const taskStats = await db.get(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) as todo_count,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
          SUM(CASE WHEN status = 'IN_REVIEW' THEN 1 ELSE 0 END) as in_review_count,
          SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as done_count
         FROM tasks
         WHERE project_id = ?`,
        [projectId]
      );

      res.status(200).json({
        success: true,
        project: {
          ...project,
          members,
          stats: taskStats || { total: 0, todo_count: 0, in_progress_count: 0, in_review_count: 0, done_count: 0 }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new project
  createProject: async (req, res, next) => {
    try {
      const { name, description, color, status, memberIds } = req.body;
      const ownerId = req.user.id;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Project name is required.' });
      }

      const result = await db.run(
        `INSERT INTO projects (name, description, owner_id, status, color)
         VALUES (?, ?, ?, ?, ?)`,
        [name.trim(), description || '', ownerId, status || 'Active', color || '#3b82f6']
      );

      const projectId = result.lastID;

      // Add owner as 'Owner' member
      await db.run(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, ownerId, 'Owner']
      );

      // Add other invited members if provided
      if (Array.isArray(memberIds)) {
        for (const mid of memberIds) {
          if (mid !== ownerId) {
            await db.run(
              'INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
              [projectId, mid, 'Member']
            );

            // Create notification for invited user
            await db.run(
              `INSERT INTO notifications (user_id, sender_id, title, message, type, link)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                mid,
                ownerId,
                'Added to Project',
                `${req.user.name} added you to project "${name.trim()}"`,
                'project_added',
                `/projects/${projectId}`
              ]
            );

            emitNotification(mid, {
              title: 'Added to Project',
              message: `${req.user.name} added you to project "${name.trim()}"`,
              type: 'project_added',
              link: `/projects/${projectId}`
            });
          }
        }
      }

      // Log activity
      await db.run(
        `INSERT INTO activity_logs (project_id, user_id, action, details)
         VALUES (?, ?, ?, ?)`,
        [projectId, ownerId, 'PROJECT_CREATED', JSON.stringify({ projectName: name.trim() })]
      );

      const createdProject = await db.get(
        `SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar
         FROM projects p
         JOIN users u ON p.owner_id = u.id
         WHERE p.id = ?`,
        [projectId]
      );

      res.status(201).json({
        success: true,
        message: 'Project created successfully.',
        project: createdProject
      });
    } catch (error) {
      next(error);
    }
  },

  // Update project
  updateProject: async (req, res, next) => {
    try {
      const projectId = req.params.id;
      const { name, description, status, color } = req.body;

      await db.run(
        `UPDATE projects 
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             status = COALESCE(?, status),
             color = COALESCE(?, color),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name ? name.trim() : null, description, status, color, projectId]
      );

      const updated = await db.get(
        `SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar
         FROM projects p
         JOIN users u ON p.owner_id = u.id
         WHERE p.id = ?`,
        [projectId]
      );

      emitToProject(projectId, 'project_updated', updated);

      res.status(200).json({
        success: true,
        message: 'Project updated successfully.',
        project: updated
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete project
  deleteProject: async (req, res, next) => {
    try {
      const projectId = req.params.id;

      // Only owner can delete project
      if (req.project.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only the project owner can delete this project.'
        });
      }

      await db.run('DELETE FROM projects WHERE id = ?', [projectId]);

      emitToProject(projectId, 'project_deleted', { projectId: Number(projectId) });

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // Add member to project
  addMember: async (req, res, next) => {
    try {
      const projectId = req.params.id;
      const { userId, role = 'Member' } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required.' });
      }

      const user = await db.get('SELECT id, name, email, avatar_url FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User to add was not found.' });
      }

      await db.run(
        'INSERT OR REPLACE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, userId, role]
      );

      // Create notification
      const notif = await db.run(
        `INSERT INTO notifications (user_id, sender_id, title, message, type, link)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          req.user.id,
          'Added to Project',
          `${req.user.name} added you to project "${req.project.name}" as ${role}`,
          'project_member_added',
          `/projects/${projectId}`
        ]
      );

      emitNotification(userId, {
        id: notif.lastID,
        title: 'Added to Project',
        message: `${req.user.name} added you to project "${req.project.name}" as ${role}`,
        type: 'project_member_added',
        link: `/projects/${projectId}`,
        created_at: new Date().toISOString()
      });

      emitToProject(projectId, 'member_added', {
        projectId: Number(projectId),
        user: { ...user, project_role: role }
      });

      res.status(200).json({
        success: true,
        message: `${user.name} has been added to the project.`,
        member: { ...user, project_role: role }
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove member from project
  removeMember: async (req, res, next) => {
    try {
      const projectId = req.params.id;
      const targetUserId = req.params.userId;

      if (Number(targetUserId) === req.project.owner_id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the project owner from the project.'
        });
      }

      await db.run(
        'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, targetUserId]
      );

      // Unassign tasks assigned to this user in this project
      await db.run(
        'UPDATE tasks SET assignee_id = NULL WHERE project_id = ? AND assignee_id = ?',
        [projectId, targetUserId]
      );

      emitToProject(projectId, 'member_removed', {
        projectId: Number(projectId),
        userId: Number(targetUserId)
      });

      res.status(200).json({
        success: true,
        message: 'Member removed successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // Real Database Dashboard Statistics
  getDashboardStats: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      // Projects where user is owner or member
      const userProjects = await db.all(
        `SELECT DISTINCT p.id 
         FROM projects p
         LEFT JOIN project_members pm ON p.id = pm.project_id
         WHERE p.owner_id = ? OR pm.user_id = ?`,
        [userId, userId]
      );

      const projectIds = userProjects.map(p => p.id);

      if (projectIds.length === 0) {
        return res.status(200).json({
          success: true,
          stats: {
            totalProjects: 0,
            activeProjects: 0,
            pendingTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            teamMembersCount: 1,
            statusDistribution: [
              { name: 'TODO', value: 0, color: '#94a3b8' },
              { name: 'IN PROGRESS', value: 0, color: '#3b82f6' },
              { name: 'IN REVIEW', value: 0, color: '#eab308' },
              { name: 'DONE', value: 0, color: '#10b981' }
            ],
            priorityDistribution: [
              { name: 'Low', count: 0 },
              { name: 'Medium', count: 0 },
              { name: 'High', count: 0 },
              { name: 'Critical', count: 0 }
            ],
            recentProjects: [],
            recentActivity: []
          }
        });
      }

      const placeholders = projectIds.map(() => '?').join(',');

      // 1. Total and Active Projects
      const projectStats = await db.get(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
         FROM projects
         WHERE id IN (${placeholders})`,
        projectIds
      );

      // 2. Task metrics
      const taskStats = await db.get(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status != 'DONE' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status != 'DONE' AND due_date IS NOT NULL AND due_date < ? THEN 1 ELSE 0 END) as overdue,
          SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) as todo_count,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
          SUM(CASE WHEN status = 'IN_REVIEW' THEN 1 ELSE 0 END) as in_review_count,
          SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as done_count,
          SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) as prio_low,
          SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) as prio_med,
          SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as prio_high,
          SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as prio_crit
         FROM tasks
         WHERE project_id IN (${placeholders})`,
        [today, ...projectIds]
      );

      // 3. Unique team members across user's projects
      const memberCountRes = await db.get(
        `SELECT COUNT(DISTINCT user_id) as count 
         FROM project_members 
         WHERE project_id IN (${placeholders})`,
        projectIds
      );

      // 4. Recent Projects
      const recentProjects = await db.all(
        `SELECT p.*,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'DONE') as completed_tasks
         FROM projects p
         WHERE p.id IN (${placeholders})
         ORDER BY p.updated_at DESC
         LIMIT 4`,
        projectIds
      );

      // 5. Recent Activity
      const recentActivity = await db.all(
        `SELECT a.*, u.name as user_name, u.avatar_url as user_avatar, p.name as project_name
         FROM activity_logs a
         JOIN users u ON a.user_id = u.id
         JOIN projects p ON a.project_id = p.id
         WHERE a.project_id IN (${placeholders})
         ORDER BY a.created_at DESC
         LIMIT 10`,
        projectIds
      );

      res.status(200).json({
        success: true,
        stats: {
          totalProjects: projectStats.total || 0,
          activeProjects: projectStats.active || 0,
          pendingTasks: taskStats.pending || 0,
          completedTasks: taskStats.completed || 0,
          overdueTasks: taskStats.overdue || 0,
          teamMembersCount: memberCountRes.count || 1,
          statusDistribution: [
            { name: 'TODO', value: taskStats.todo_count || 0, color: '#94a3b8' },
            { name: 'IN PROGRESS', value: taskStats.in_progress_count || 0, color: '#3b82f6' },
            { name: 'IN REVIEW', value: taskStats.in_review_count || 0, color: '#eab308' },
            { name: 'DONE', value: taskStats.done_count || 0, color: '#10b981' }
          ],
          priorityDistribution: [
            { name: 'Low', count: taskStats.prio_low || 0 },
            { name: 'Medium', count: taskStats.prio_med || 0 },
            { name: 'High', count: taskStats.prio_high || 0 },
            { name: 'Critical', count: taskStats.prio_crit || 0 }
          ],
          recentProjects,
          recentActivity
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = projectController;
