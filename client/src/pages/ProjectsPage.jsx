import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Users, 
  CheckCircle2, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  ArrowRight,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function ProjectsPage({ onOpenCreateProject }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      if (res.data.success) {
        setProjects(res.data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Real-time socket events for projects
  useEffect(() => {
    if (!socket) return;

    const handleProjectUpdated = () => fetchProjects();
    const handleProjectDeleted = () => fetchProjects();

    socket.on('project_updated', handleProjectUpdated);
    socket.on('project_deleted', handleProjectDeleted);

    return () => {
      socket.off('project_updated', handleProjectUpdated);
      socket.off('project_deleted', handleProjectDeleted);
    };
  }, [socket]);

  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this project and all its tasks?')) {
      try {
        await api.delete(`/projects/${projectId}`);
        setProjects(projects.filter((p) => p.id !== projectId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete project');
      }
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || (p.status && p.status.toUpperCase() === statusFilter);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Group Projects ({filteredProjects.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your collaborative project workspaces and team permissions.
          </p>
        </div>

        <button
          onClick={onOpenCreateProject}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-indigo-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'ACTIVE', 'IN PROGRESS', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  statusFilter === status
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center border-l border-slate-200 pl-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Content */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search query or filter.' : 'Create a group project to start assigning tasks and collaborating with your team.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenCreateProject}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-indigo-700 transition-colors"
            >
              + Create First Project
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const total = p.total_tasks || 0;
            const completed = p.completed_tasks || 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isOwner = p.owner_id === user?.id;

            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card hover:border-indigo-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Top: Accent bar + Status + Delete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || '#4f46e5' }}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {p.status || 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isOwner && (
                        <button
                          onClick={(e) => handleDeleteProject(e, p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Project Name & Description */}
                  <div>
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{percent}% Complete</span>
                      <span className="text-slate-400">{completed}/{total} tasks</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Members & Link to Board */}
                <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center -space-x-1.5 overflow-hidden">
                    {p.members && p.members.map((m) => (
                      <img
                        key={m.id}
                        src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`}
                        alt={m.name}
                        title={`${m.name} (${m.role})`}
                        className="w-6 h-6 rounded-full ring-2 ring-white object-cover shadow-xs"
                      />
                    ))}
                    {p.member_count > 5 && (
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        +{p.member_count - 5}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/projects/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>Open Board</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle divide-y divide-slate-100 overflow-hidden">
          {filteredProjects.map((p) => {
            const total = p.total_tasks || 0;
            const completed = p.completed_tasks || 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isOwner = p.owner_id === user?.id;

            return (
              <div
                key={p.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color || '#4f46e5' }}
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-500 truncate max-w-md">{p.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-auto">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-slate-800">{percent}% Complete</p>
                    <p className="text-[11px] text-slate-400">{completed}/{total} tasks</p>
                  </div>

                  <Link
                    to={`/projects/${p.id}`}
                    className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <span>Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {isOwner && (
                    <button
                      onClick={(e) => handleDeleteProject(e, p.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
