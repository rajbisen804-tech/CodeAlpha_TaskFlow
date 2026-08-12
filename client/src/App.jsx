import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import CreateProjectModal from './components/CreateProjectModal';
import CreateTaskModal from './components/CreateTaskModal';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectBoardPage from './pages/ProjectBoardPage';
import TeamPage from './pages/TeamPage';
import NotFoundPage from './pages/NotFoundPage';
import api from './services/api';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [projectsList, setProjectsList] = useState([]);

  const refreshProjects = async () => {
    try {
      if (isAuthenticated) {
        const res = await api.get('/projects');
        if (res.data.success) {
          setProjectsList(res.data.projects || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshProjects();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <ToastContainer />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex flex-col">
                <Navbar
                  onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  onOpenCreateTask={() => setCreateTaskOpen(true)}
                  onOpenCreateProject={() => setCreateProjectOpen(true)}
                />

                <div className="flex-1 flex overflow-hidden">
                  <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onOpenCreateProject={() => setCreateProjectOpen(true)}
                  />

                  <main className="flex-1 overflow-y-auto bg-slate-50/50">
                    <Routes>
                      <Route
                        path="dashboard"
                        element={
                          <DashboardPage
                            onOpenCreateProject={() => setCreateProjectOpen(true)}
                            onOpenCreateTask={() => setCreateTaskOpen(true)}
                          />
                        }
                      />
                      <Route
                        path="projects"
                        element={
                          <ProjectsPage
                            onOpenCreateProject={() => setCreateProjectOpen(true)}
                          />
                        }
                      />
                      <Route path="projects/:id" element={<ProjectBoardPage />} />
                      <Route path="team" element={<TeamPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                </div>

                {/* Global Modals */}
                <CreateProjectModal
                  isOpen={createProjectOpen}
                  onClose={() => setCreateProjectOpen(false)}
                  onProjectCreated={() => refreshProjects()}
                />

                <CreateTaskModal
                  isOpen={createTaskOpen}
                  projects={projectsList}
                  onClose={() => setCreateTaskOpen(false)}
                  onTaskCreated={() => refreshProjects()}
                />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
