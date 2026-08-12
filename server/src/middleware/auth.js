const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_pro_super_secret_jwt_key_2026_change_in_production';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(
      'SELECT id, name, email, avatar_url, role, bio, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
}

// Check if user is owner or member of project
async function checkProjectAccess(req, res, next) {
  const projectId = req.params.id || req.params.projectId || req.body.project_id;
  if (!projectId) {
    return res.status(400).json({ success: false, message: 'Project ID is required.' });
  }

  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check if user is owner or in project_members
    if (project.owner_id === req.user.id) {
      req.project = project;
      req.userProjectRole = 'Owner';
      return next();
    }

    const membership = await db.get(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.user.id]
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not a member of this project.'
      });
    }

    req.project = project;
    req.userProjectRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
}

// Check if user is project owner or admin
async function checkProjectAdmin(req, res, next) {
  const projectId = req.params.id || req.params.projectId || req.body.project_id;
  if (!projectId) {
    return res.status(400).json({ success: false, message: 'Project ID is required.' });
  }

  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.owner_id === req.user.id) {
      req.project = project;
      req.userProjectRole = 'Owner';
      return next();
    }

    const membership = await db.get(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.user.id]
    );

    if (!membership || (membership.role !== 'Owner' && membership.role !== 'Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only project owners or admins can perform this action.'
      });
    }

    req.project = project;
    req.userProjectRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticateToken,
  checkProjectAccess,
  checkProjectAdmin,
  JWT_SECRET
};
