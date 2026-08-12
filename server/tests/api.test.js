const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('TaskFlow Pro Full REST API Test Suite', () => {
  let authToken = '';
  let testUserId = null;
  let createdProjectId = null;
  let createdTaskId = null;
  let createdCommentId = null;

  beforeAll(async () => {
    process.env.DATABASE_FILE = './src/config/test.sqlite';
    await db.initDb();
    // Clean test db
    await db.run('DELETE FROM notifications');
    await db.run('DELETE FROM activity_logs');
    await db.run('DELETE FROM comments');
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM project_members');
    await db.run('DELETE FROM projects');
    await db.run('DELETE FROM users');
  });

  afterAll(async () => {
    await db.close();
  });

  describe('1. Health Check & Public Routes', () => {
    it('should return server status online', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('online');
    });

    it('should return 404 on non-existing routes', async () => {
      const res = await request(app).get('/api/invalid-route-1234');
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Authentication Flow', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Engineer',
          email: 'tester@taskflow.dev',
          password: 'securepassword123',
          role: 'QA Engineer'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toEqual('tester@taskflow.dev');
      testUserId = res.body.user.id;
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Tester',
          email: 'tester@taskflow.dev',
          password: 'securepassword123'
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
    });

    it('should login with registered credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tester@taskflow.dev',
          password: 'securepassword123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tester@taskflow.dev',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
    });

    it('should fetch authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.name).toEqual('Test Engineer');
    });
  });

  describe('3. Projects Management', () => {
    it('should create a new project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'TaskFlow Pro Mobile App',
          description: 'Next-gen cross-platform project management tool',
          status: 'Active',
          color: '#4f46e5'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.project.name).toEqual('TaskFlow Pro Mobile App');
      createdProjectId = res.body.project.id;
    });

    it('should get all projects for the user', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.projects)).toBe(true);
      expect(res.body.projects.length).toBeGreaterThanOrEqual(1);
    });

    it('should fetch project details by ID', async () => {
      const res = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.project.id).toEqual(createdProjectId);
      expect(res.body.project.stats).toBeDefined();
    });

    it('should update project details', async () => {
      const res = await request(app)
        .put(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'TaskFlow Pro Mobile App Updated',
          status: 'In Progress'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.project.name).toEqual('TaskFlow Pro Mobile App Updated');
    });
  });

  describe('4. Tasks & Kanban Management', () => {
    it('should create a task in the project', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: createdProjectId,
          title: 'Implement Dark Mode and Kanban Columns',
          description: 'Design interactive drag and drop columns with smooth animations',
          status: 'TODO',
          priority: 'High',
          due_date: '2026-12-31',
          labels: ['UI/UX', 'Frontend']
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.task.title).toEqual('Implement Dark Mode and Kanban Columns');
      expect(res.body.task.status).toEqual('TODO');
      createdTaskId = res.body.task.id;
    });

    it('should list tasks for the project', async () => {
      const res = await request(app)
        .get(`/api/projects/${createdProjectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.tasks.length).toBe(1);
      expect(res.body.tasks[0].id).toEqual(createdTaskId);
    });

    it('should move task to IN_PROGRESS (Kanban status update)', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${createdTaskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'IN_PROGRESS'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.task.status).toEqual('IN_PROGRESS');
    });

    it('should fetch single task with activity trail', async () => {
      const res = await request(app)
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.task.activities.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Comments Flow', () => {
    it('should add a comment to the task', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_id: createdTaskId,
          content: 'Tested the Kanban status transition, working seamlessly! 🚀'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.comment.content).toContain('Tested the Kanban');
      createdCommentId = res.body.comment.id;
    });

    it('should retrieve comments for the task', async () => {
      const res = await request(app)
        .get(`/api/tasks/${createdTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.comments.length).toBe(1);
    });
  });

  describe('6. Real Database Dashboard Stats', () => {
    it('should return aggregated dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/projects/dashboard-stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.stats.totalProjects).toBeGreaterThanOrEqual(1);
      expect(res.body.stats.statusDistribution).toBeDefined();
      expect(res.body.stats.priorityDistribution).toBeDefined();
      expect(res.body.stats.recentProjects).toBeDefined();
    });
  });

  describe('7. Notifications Flow', () => {
    it('should retrieve user notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.unreadCount).toBeDefined();
    });
  });
});
