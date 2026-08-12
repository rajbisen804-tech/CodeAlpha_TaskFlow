# TaskFlow Pro ⚡ — Production Collaborative Project Management Platform

> **CodeAlpha Full Stack Development Internship — Task 3**  
> A high-velocity, real-time collaborative project management application featuring interactive drag-and-drop Kanban boards, live WebSockets synchronization, in-task comments, audit trails, and data-driven analytical dashboards.

---

## 🌟 Key Highlights & Features

- 🎯 **Group Projects Management**: Create, edit, configure accent themes, and invite team members with granular permission roles (`Owner`, `Admin`, `Member`, `Viewer`).
- 📋 **Interactive Kanban Board**: 4-column workflow (`TODO`, `IN PROGRESS`, `IN REVIEW`, `DONE`) with smooth HTML5 drag-and-drop, priority tagging (`Low`, `Medium`, `High`, `Critical`), due dates, and custom labels.
- 💬 **In-Task Communication & Comments**: Real-time message stream on every task card with author avatars, relative timestamps, and edit/delete capabilities.
- ⚡ **Real-Time WebSockets (Socket.IO)**: Multi-user live synchronization across separate tabs/devices for task moves, status transitions, comments, and push notifications without page reload.
- 📊 **Real Database Analytics & Charts**: Real-time metrics computed directly from SQLite database: Total Projects, Active Projects, Pending Tasks, Completed Tasks, Overdue alerts, status distribution donuts, and priority volume charts using **Recharts**.
- 🔔 **Instant Notification System**: Navbar notification bell with live unread counter badge, category icons, direct link routing, and mark-as-read controls.
- 🛡️ **Enterprise Security**: JWT-based stateless authentication, bcrypt password hashing, input validation, and role-based route guards.
- 🧪 **Automated API Test Suite**: Supertest + Jest integration tests covering auth, projects, tasks, Kanban column transitions, comments, and notifications.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM, Lucide Icons, Recharts, Axios, Socket.IO Client |
| **Backend** | Node.js, Express.js, Socket.IO, SQLite3, JSON Web Tokens (JWT), Bcrypt.js, CORS |
| **Database** | SQLite (with foreign key constraints, WAL mode, and dedicated indexes) |
| **Testing** | Jest, Supertest |

---

## 🏗️ System Architecture

```
                                +---------------------------+
                                |  React 18 + Vite Frontend |
                                |   (Tailwind & Lucide UI)  |
                                +-------------+-------------+
                                              |
                       HTTP REST / Bearer JWT | WebSocket Events
                                              v
                                +-------------+-------------+
                                |     Express.js Server     |
                                |       (Port: 5000)        |
                                +-------------+-------------+
                                              |
                              +---------------+---------------+
                              |                               |
                              v                               v
                   +---------------------+         +---------------------+
                   |   Socket.IO Gateway |         |   SQLite Database   |
                   | (project_ / user_ ) |         |   (Async DB Layer)  |
                   +---------------------+         +---------------------+
```

---

## 🗄️ Database Schema

```sql
users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'Member',
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL,
  status TEXT DEFAULT 'Active',
  color TEXT DEFAULT '#4f46e5',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'Member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'TODO',
  priority TEXT DEFAULT 'Medium',
  assignee_id INTEGER,
  creator_id INTEGER NOT NULL,
  due_date TEXT,
  labels TEXT DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  details TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  sender_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 2. Installation
Clone or navigate to the project directory:
```bash
cd CodeAlpha_TaskFlowPro
```

Install root, server, and client dependencies:
```bash
# Install all dependencies at once
npm run install:all
```

Or manually install each folder:
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Initialize & Seed Database
Populate realistic demo accounts, projects, Kanban tasks, comments, and audit history:
```bash
npm run seed
```

### 4. Run Development Servers
Start both the Backend (port 5000) and Frontend (port 5173) concurrently:
```bash
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000/api`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Pre-Seeded Demo Accounts

Click the **1-Click Demo Login** buttons on the login page or sign in with:

| User | Email | Password | Role |
|---|---|---|---|
| **Alex Johnson** (Lead) | `alex@taskflow.dev` | `password123` | Product Lead & Architect |
| **Sarah Chen** (Design) | `sarah@taskflow.dev` | `password123` | Senior UI/UX Designer |
| **Mike Taylor** (Dev) | `mike@taskflow.dev` | `password123` | Full-Stack Engineer |

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Get current logged-in user profile
- `PUT /api/auth/profile` — Update user profile details
- `GET /api/auth/users` — List team users with workload stats

### Projects & Dashboard
- `GET /api/projects` — Fetch all user's projects with progress stats
- `POST /api/projects` — Create a new group project
- `GET /api/projects/:id` — Get project details, members, and task summary
- `PUT /api/projects/:id` — Update project metadata
- `DELETE /api/projects/:id` — Delete project (Owner only)
- `POST /api/projects/:id/members` — Add member to project
- `DELETE /api/projects/:id/members/:userId` — Remove member from project
- `GET /api/projects/dashboard-stats` — Aggregate real dashboard analytics

### Tasks & Kanban Board
- `GET /api/projects/:id/tasks` — List tasks with search & filters
- `POST /api/tasks` — Create task and notify assignee
- `GET /api/tasks/:id` — Get task with comments and activity trail
- `PUT /api/tasks/:id` — Update task details
- `PATCH /api/tasks/:id/status` — Drag-and-drop status transition
- `DELETE /api/tasks/:id` — Remove task

### Comments & Notifications
- `GET /api/tasks/:id/comments` — List comments for task
- `POST /api/comments` — Post a new comment
- `PUT /api/comments/:id` — Edit own comment
- `DELETE /api/comments/:id` — Delete own comment
- `GET /api/notifications` — Fetch user's notifications
- `PUT /api/notifications/:id/read` — Mark notification as read
- `PUT /api/notifications/read-all` — Mark all notifications as read

---

## ⚡ WebSocket Real-Time Events

| Event Name | Direction | Payload Description |
|---|---|---|
| `join_project` | Client ➔ Server | Joins project broadcast room (`project_${id}`) |
| `join_user` | Client ➔ Server | Joins personal user notification channel (`user_${id}`) |
| `task_created` | Server ➔ Project Room | Broadcasts newly created task card |
| `task_updated` | Server ➔ Project Room | Broadcasts task metadata updates |
| `task_status_changed` | Server ➔ Project Room | Broadcasts Kanban column movement |
| `task_deleted` | Server ➔ Project Room | Broadcasts task removal |
| `comment_added` | Server ➔ Project Room | Broadcasts new comment to active viewers |
| `notification_created` | Server ➔ User Channel | Delivers direct push notification toast |

---

## 🧪 Running Automated Tests

Run the complete backend integration test suite:
```bash
npm test
```

The test runner executes 12 integration tests verifying:
- Authentication & JWT token issuance
- Project lifecycle and permissions
- Task CRUD and Kanban column reordering
- Comments and real-time notification triggers
- Dashboard analytical aggregations

---

## 📂 Project Structure

```
CodeAlpha_TaskFlowPro/
├── dev-runner.js                # Concurrent launcher for backend & frontend
├── package.json                 # Monorepo scripts
├── .gitignore                   # Ignore node_modules, .env, *.sqlite
├── .env.example                 # Example environment variables
├── README.md                    # Comprehensive documentation
├── server/
│   ├── package.json
│   ├── .env
│   ├── src/
│   │   ├── app.js               # Express app configuration
│   │   ├── server.js            # HTTP & Socket.IO entry point
│   │   ├── config/
│   │   │   ├── db.js            # SQLite database manager & schema
│   │   │   └── seed.js          # Demo data generator
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   ├── commentController.js
│   │   │   └── notificationController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT authentication & route guards
│   │   │   └── errorHandler.js  # Central error handler
│   │   ├── routes/              # REST route definitions
│   │   └── sockets/
│   │       └── socketHandler.js # Socket.IO room subscriptions
│   └── tests/
│       └── api.test.js          # Automated Supertest test suite
└── client/
    ├── package.json
    ├── vite.config.js           # Vite dev proxy configuration
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── App.jsx              # App router & layout orchestrator
        ├── main.jsx
        ├── index.css
        ├── context/
        │   ├── AuthContext.jsx   # Persistent JWT authentication
        │   └── SocketContext.jsx # Real-time Socket.IO & toast manager
        ├── services/
        │   └── api.js           # Axios instance with interceptors
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   ├── NotificationBell.jsx
        │   ├── TaskCard.jsx     # Kanban card with DnD
        │   ├── TaskModal.jsx    # Comments & audit trail modal
        │   ├── CreateTaskModal.jsx
        │   ├── CreateProjectModal.jsx
        │   └── ToastContainer.jsx
        └── pages/
            ├── LandingPage.jsx  # Hero, features & marketing
            ├── LoginPage.jsx    # 1-Click demo logins
            ├── RegisterPage.jsx # Account creation
            ├── DashboardPage.jsx# Recharts analytics & live stream
            ├── ProjectsPage.jsx # Project list & grid view
            ├── ProjectBoardPage.jsx # Full interactive Kanban board
            ├── TeamPage.jsx     # Team member directory
            └── NotFoundPage.jsx
```

---

## 🏆 CodeAlpha Internship Submission Checklist

- [x] **Requirement 1**: Create group projects with descriptions, custom colors, and members
- [x] **Requirement 2**: Assign tasks with priorities, due dates, and tags
- [x] **Requirement 3**: Comment and communicate directly within tasks with real-time sync
- [x] **Requirement 4**: Full-stack application with authentication, project boards, and task cards
- [x] **Requirement 5**: Backend managing users, projects, tasks, comments, and activity logs
- [x] **Requirement 6**: Real-time WebSockets synchronization via Socket.IO
- [x] **Requirement 7**: Real database statistics (no fake hardcoded stats)
- [x] **Requirement 8**: Automated API test suite and complete GitHub-ready documentation
