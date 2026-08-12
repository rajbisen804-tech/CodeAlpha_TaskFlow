const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

const authController = {
  register: async (req, res, next) => {
    try {
      const { name, email, password, role, bio, avatar_url } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required fields.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }

      const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const defaultAvatar = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

      const result = await db.run(
        'INSERT INTO users (name, email, password_hash, avatar_url, role, bio) VALUES (?, ?, ?, ?, ?, ?)',
        [name.trim(), email.toLowerCase().trim(), passwordHash, defaultAvatar, role || 'Member', bio || '']
      );

      const user = await db.get(
        'SELECT id, name, email, avatar_url, role, bio, created_at FROM users WHERE id = ?',
        [result.lastID]
      );

      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.'
        });
      }

      const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const token = generateToken(user.id);

      const { password_hash, ...safeUser } = user;

      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: safeUser
      });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res) => {
    res.status(200).json({
      success: true,
      user: req.user
    });
  },

  updateProfile: async (req, res, next) => {
    try {
      const { name, bio, avatar_url, role } = req.body;
      const userId = req.user.id;

      await db.run(
        `UPDATE users 
         SET name = COALESCE(?, name), 
             bio = COALESCE(?, bio), 
             avatar_url = COALESCE(?, avatar_url),
             role = COALESCE(?, role)
         WHERE id = ?`,
        [name, bio, avatar_url, role, userId]
      );

      const updatedUser = await db.get(
        'SELECT id, name, email, avatar_url, role, bio, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  getAllUsers: async (req, res, next) => {
    try {
      const users = await db.all(`
        SELECT u.id, u.name, u.email, u.avatar_url, u.role, u.bio,
          (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id) as assigned_tasks_count,
          (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status = 'DONE') as completed_tasks_count
        FROM users u
        ORDER BY u.name ASC
      `);

      res.status(200).json({
        success: true,
        users
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
