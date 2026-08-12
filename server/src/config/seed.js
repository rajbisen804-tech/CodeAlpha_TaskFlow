const bcrypt = require('bcryptjs');
const db = require('./db');

async function seedDatabase() {
  try {
    console.log('🌱 Initializing & Seeding TaskFlow Pro database...');
    await db.initDb();

    // Clear existing data safely
    await db.run('DELETE FROM notifications');
    await db.run('DELETE FROM activity_logs');
    await db.run('DELETE FROM comments');
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM project_members');
    await db.run('DELETE FROM projects');
    await db.run('DELETE FROM users');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Insert Users
    const users = [
      {
        name: 'Alex Johnson',
        email: 'alex@taskflow.dev',
        role: 'Product Lead & Architect',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Building scalable collaborative systems and leading product vision.'
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@taskflow.dev',
        role: 'Senior UI/UX Designer',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        bio: 'Crafting intuitive user interfaces and delightful design systems.'
      },
      {
        name: 'Mike Taylor',
        email: 'mike@taskflow.dev',
        role: 'Full-Stack Engineer',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Real-time WebSockets, microservices, and backend performance.'
      }
    ];

    const userIds = [];
    for (const u of users) {
      const res = await db.run(
        'INSERT INTO users (name, email, password_hash, avatar_url, role, bio) VALUES (?, ?, ?, ?, ?, ?)',
        [u.name, u.email, passwordHash, u.avatar_url, u.role, u.bio]
      );
      userIds.push(res.lastID);
    }
    const [alexId, sarahId, mikeId] = userIds;

    // 2. Insert Projects
    const p1 = await db.run(
      `INSERT INTO projects (name, description, owner_id, status, color)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'TaskFlow Pro SaaS Platform',
        'Next-generation collaborative workspace featuring real-time kanban boards, live socket sync, and automated analytics.',
        alexId,
        'Active',
        '#4f46e5'
      ]
    );
    const p1Id = p1.lastID;

    const p2 = await db.run(
      `INSERT INTO projects (name, description, owner_id, status, color)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'Mobile App Experience v2.0',
        'Redesigning mobile project management with offline-first caching and instant push notifications.',
        sarahId,
        'Active',
        '#0284c7'
      ]
    );
    const p2Id = p2.lastID;

    // 3. Project Members
    await db.run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [p1Id, alexId, 'Owner']);
    await db.run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [p1Id, sarahId, 'Admin']);
    await db.run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [p1Id, mikeId, 'Member']);

    await db.run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [p2Id, sarahId, 'Owner']);
    await db.run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [p2Id, alexId, 'Admin']);
    await db.run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [p2Id, mikeId, 'Member']);

    // 4. Tasks for Project 1
    const tasksP1 = [
      {
        title: 'Design Dark & Light Theme Design Tokens',
        description: 'Establish unified CSS custom properties for typography, surfaces, borders, and shadows.',
        status: 'DONE',
        priority: 'High',
        assignee_id: sarahId,
        creator_id: alexId,
        due_date: '2026-08-15',
        labels: JSON.stringify(['Design', 'UI/UX', 'CSS']),
        order_index: 0
      },
      {
        title: 'Implement WebSocket Real-time Broadcast Room',
        description: 'Configure Socket.IO room subscriptions per project and emit granular task & notification events.',
        status: 'DONE',
        priority: 'Critical',
        assignee_id: mikeId,
        creator_id: alexId,
        due_date: '2026-08-18',
        labels: JSON.stringify(['Backend', 'WebSockets', 'Realtime']),
        order_index: 1
      },
      {
        title: 'Kanban Drag & Drop Interactive Columns',
        description: 'Smooth column movement with real-time state synchronization and touch support for tablets.',
        status: 'IN_PROGRESS',
        priority: 'Critical',
        assignee_id: alexId,
        creator_id: alexId,
        due_date: '2026-08-20',
        labels: JSON.stringify(['Frontend', 'Kanban', 'Feature']),
        order_index: 0
      },
      {
        title: 'Audit Logging & Activity Timeline Stream',
        description: 'Track task status changes, assignee modifications, comments, and project updates in dedicated audit table.',
        status: 'IN_PROGRESS',
        priority: 'Medium',
        assignee_id: mikeId,
        creator_id: sarahId,
        due_date: '2026-08-22',
        labels: JSON.stringify(['Backend', 'Audit', 'Security']),
        order_index: 1
      },
      {
        title: 'Task Commenting and Mention System',
        description: 'Allow team members to communicate inside task cards with markdown support and live author indicators.',
        status: 'IN_REVIEW',
        priority: 'High',
        assignee_id: sarahId,
        creator_id: alexId,
        due_date: '2026-08-21',
        labels: JSON.stringify(['Feature', 'Collaboration']),
        order_index: 0
      },
      {
        title: 'Automated CI/CD Pipeline & API Test Suite',
        description: 'Add Jest Supertest integration tests for auth, projects, tasks, and notification endpoints.',
        status: 'TODO',
        priority: 'High',
        assignee_id: mikeId,
        creator_id: alexId,
        due_date: '2026-08-25',
        labels: JSON.stringify(['DevOps', 'Testing']),
        order_index: 0
      },
      {
        title: 'Performance Benchmark & SQLite WAL Tuning',
        description: 'Ensure sub-10ms response times for complex dashboard queries with proper indexes.',
        status: 'TODO',
        priority: 'Low',
        assignee_id: null,
        creator_id: mikeId,
        due_date: '2026-08-28',
        labels: JSON.stringify(['Performance', 'Database']),
        order_index: 1
      }
    ];

    const taskIds = [];
    for (const t of tasksP1) {
      const res = await db.run(
        `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, creator_id, due_date, labels, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p1Id, t.title, t.description, t.status, t.priority, t.assignee_id, t.creator_id, t.due_date, t.labels, t.order_index]
      );
      taskIds.push(res.lastID);
    }

    // 5. Comments on Task 3 (Kanban Drag & Drop)
    await db.run(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskIds[2], sarahId, 'I tested the column drop animation on Safari and Chrome, looks super smooth! 🚀']
    );
    await db.run(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskIds[2], alexId, 'Great! Added keyboard accessibility shortcuts as well for full keyboard navigation.']
    );

    // Comments on Task 5 (Task Commenting System)
    await db.run(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskIds[4], mikeId, 'WebSocket events for comments are tested and broadcasting instantly.']
    );

    // 6. Activity Logs
    const activities = [
      {
        task_id: taskIds[2],
        project_id: p1Id,
        user_id: alexId,
        action: 'STATUS_CHANGED',
        details: JSON.stringify({ from: 'TODO', to: 'IN_PROGRESS', taskTitle: 'Kanban Drag & Drop Interactive Columns' })
      },
      {
        task_id: taskIds[1],
        project_id: p1Id,
        user_id: mikeId,
        action: 'TASK_COMPLETED',
        details: JSON.stringify({ taskTitle: 'Implement WebSocket Real-time Broadcast Room' })
      },
      {
        task_id: taskIds[4],
        project_id: p1Id,
        user_id: sarahId,
        action: 'COMMENT_ADDED',
        details: JSON.stringify({ taskTitle: 'Task Commenting and Mention System' })
      }
    ];

    for (const act of activities) {
      await db.run(
        'INSERT INTO activity_logs (task_id, project_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)',
        [act.task_id, act.project_id, act.user_id, act.action, act.details]
      );
    }

    // 7. Notifications
    const sampleNotifications = [
      {
        user_id: alexId,
        sender_id: sarahId,
        title: 'New Comment on Task',
        message: 'Sarah Chen commented on "Kanban Drag & Drop Interactive Columns"',
        type: 'comment',
        link: `/projects/${p1Id}`,
        is_read: 0
      },
      {
        user_id: alexId,
        sender_id: mikeId,
        title: 'Task Completed',
        message: 'Mike Taylor completed "Implement WebSocket Real-time Broadcast Room"',
        type: 'task_completed',
        link: `/projects/${p1Id}`,
        is_read: 0
      },
      {
        user_id: sarahId,
        sender_id: alexId,
        title: 'Assigned to Project',
        message: 'You were added as Admin to TaskFlow Pro SaaS Platform',
        type: 'project_assigned',
        link: `/projects/${p1Id}`,
        is_read: 1
      },
      {
        user_id: mikeId,
        sender_id: alexId,
        title: 'New Task Assigned',
        message: 'Alex Johnson assigned you to "Automated CI/CD Pipeline & API Test Suite"',
        type: 'task_assigned',
        link: `/projects/${p1Id}`,
        is_read: 0
      }
    ];

    for (const notif of sampleNotifications) {
      await db.run(
        `INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [notif.user_id, notif.sender_id, notif.title, notif.message, notif.type, notif.link, notif.is_read]
      );
    }

    console.log('✨ Seed completed successfully!');
    console.log('--------------------------------------------------');
    console.log('Demo Credentials for Instant Testing:');
    console.log('1. Alex Johnson (Lead):   alex@taskflow.dev   / password123');
    console.log('2. Sarah Chen (Designer): sarah@taskflow.dev  / password123');
    console.log('3. Mike Taylor (Dev):     mike@taskflow.dev   / password123');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ Database seeding error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = seedDatabase;
