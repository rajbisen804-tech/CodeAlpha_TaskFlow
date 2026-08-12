const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const { authenticateToken, checkProjectAccess, checkProjectAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// Dashboard real statistics
router.get('/dashboard-stats', projectController.getDashboardStats);

// Project CRUD
router.get('/', projectController.getAllProjects);
router.post('/', projectController.createProject);
router.get('/:id', checkProjectAccess, projectController.getProjectById);
router.put('/:id', checkProjectAdmin, projectController.updateProject);
router.delete('/:id', checkProjectAccess, projectController.deleteProject);

// Project members
router.post('/:id/members', checkProjectAdmin, projectController.addMember);
router.delete('/:id/members/:userId', checkProjectAdmin, projectController.removeMember);

// Project tasks nested shortcut
router.get('/:id/tasks', checkProjectAccess, taskController.getTasksByProject);
router.post('/:id/tasks', checkProjectAccess, (req, res, next) => {
  req.body.project_id = req.params.id;
  taskController.createTask(req, res, next);
});

module.exports = router;
