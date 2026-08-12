import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  PlusCircle, 
  Layers, 
  ChevronRight, 
  CheckSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';

export default function Sidebar({ isOpen, onClose, onOpenCreateProject }) {
  const [projects, setProjects] = useState([]);
  const location = useLocation();

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.get('/projects');
        if (res.data.success) {
          setProjects(res.data.projects || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProjects();
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Team Members', path: '/team', icon: Users },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:h-[calc(100vh-4rem)]`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Main Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Active Projects Quick Access */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Your Projects ({projects.length})
              </p>
              {onOpenCreateProject && (
                <button
                  onClick={onOpenCreateProject}
                  className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors"
                  title="Create Project"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              {projects.length === 0 ? (
                <div className="px-3 py-3 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-500 font-medium">No projects created</p>
                  <button
                    onClick={onOpenCreateProject}
                    className="mt-1.5 text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    + Create first project
                  </button>
                </div>
              ) : (
                projects.map((p) => (
                  <NavLink
                    key={p.id}
                    to={`/projects/${p.id}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || '#4f46e5' }}
                      />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600 bg-slate-100 group-hover:bg-slate-200/80 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                      {p.total_tasks || 0}
                    </span>
                  </NavLink>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer / Portfolio Banner */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl text-white shadow-sm">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-200 uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-indigo-300" />
              <span>CodeAlpha Task 3</span>
            </div>
            <p className="text-xs font-medium text-slate-100 leading-snug">
              Collaborative Project Management with WebSockets
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
