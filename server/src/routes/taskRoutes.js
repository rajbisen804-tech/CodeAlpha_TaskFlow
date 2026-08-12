const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.delete('/:id', taskController.deleteTask);

// Task comments nested endpoints
router.get('/:id/comments', commentController.getCommentsByTask);
router.post('/:id/comments', (req, res, next) => {
  req.body.task_id = req.params.id;
  commentController.addComment(req, res, next);
});

module.exports = router;
