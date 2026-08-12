import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  Activity, 
  ArrowRight, 
  Plus, 
  Layers, 
  TrendingUp,
  BarChart2,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis 
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function DashboardPage({ onOpenCreateProject, onOpenCreateTask }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Listen to live events that should refresh dashboard metrics
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchStats();
    };

    socket.on('task_created', handleRefresh);
    socket.on('task_status_changed', handleRefresh);
    socket.on('task_deleted', handleRefresh);
    socket.on('project_updated', handleRefresh);
    socket.on('project_deleted', handleRefresh);

    return () => {
      socket.off('task_created', handleRefresh);
      socket.off('task_status_changed', handleRefresh);
      socket.off('task_deleted', handleRefresh);
      socket.off('project_updated', handleRefresh);
      socket.off('project_deleted', handleRefresh);
    };
  }, [socket]);

  const statCards = [
    {
      label: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: FolderKanban,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      badge: `${stats?.activeProjects || 0} active`,
    },
    {
      label: 'Pending Tasks',
      value: stats?.pendingTasks || 0,
      icon: Clock,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
      badge: 'In workflow',
    },
    {
      label: 'Completed Tasks',
      value: stats?.completedTasks || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      badge: 'Successfully done',
    },
    {
      label: 'Overdue Tasks',
      value: stats?.overdueTasks || 0,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      badge: stats?.overdueTasks > 0 ? 'Requires attention' : 'All on track',
    },
    {
      label: 'Collaborators',
      value: stats?.teamMembersCount || 1,
      icon: Users,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
      badge: 'Team members',
    },
  ];

  const STATUS_COLORS = ['#94a3b8', '#3b82f6', '#eab308', '#10b981'];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name} 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Here's what's happening across your collaborative workspaces today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenCreateProject}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-all"
          >
            <FolderKanban className="w-4 h-4 text-indigo-600" />
            <span>New Project</span>
          </button>
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-subtle hover:border-indigo-200 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  {card.badge}
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {loading ? '...' : card.value}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section: Status Distribution & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Task Status Doughnut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Task Status Distribution</h3>
              <p className="text-xs text-slate-400">Live breakdown across all assigned projects</p>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {loading ? (
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : stats?.statusDistribution?.reduce((a, b) => a + b.value, 0) === 0 ? (
              <p className="text-xs text-slate-400 italic">No tasks created yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats?.statusDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      borderRadius: '0.75rem',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600 font-medium mr-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Priority Breakdown Bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Priority Volume</h3>
              <p className="text-xs text-slate-400">Active tasks categorized by urgency</p>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {loading ? (
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.priorityDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      borderRadius: '0.75rem',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Projects & Real-time Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Active Projects</h3>
              <p className="text-xs text-slate-400">Your recent collaborative boards</p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {stats?.recentProjects?.length === 0 ? (
              <div className="col-span-2 text-center py-8 border border-dashed border-slate-200 rounded-xl">
                <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No projects found</p>
                <button
                  onClick={onOpenCreateProject}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  + Create your first project
                </button>
              </div>
            ) : (
              stats?.recentProjects?.map((proj) => {
                const total = proj.total_tasks || 0;
                const completed = proj.completed_tasks || 0;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Link
                    key={proj.id}
                    to={`/projects/${proj.id}`}
                    className="group block p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-card transition-all bg-slate-50/40 hover:bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: proj.color || '#4f46e5' }}
                        />
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[170px]">
                          {proj.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                        {percent}% Done
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {proj.description || 'No description provided.'}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                      <span>{completed}/{total} tasks complete</span>
                      <span className="group-hover:translate-x-1 transition-transform text-indigo-600 font-semibold flex items-center gap-0.5">
                        Open Board <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Live Activity Stream (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Live Activity</h3>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              Audit Stream
            </span>
          </div>

          <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
            {stats?.recentActivity?.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No recent actions recorded.</p>
            ) : (
              stats?.recentActivity?.map((act) => {
                let detailsObj = {};
                try {
                  detailsObj = JSON.parse(act.details || '{}');
                } catch(e) {}

                return (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs text-slate-600 pb-2 border-b border-slate-100 last:border-0">
                    <img
                      src={act.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(act.user_name || 'User')}`}
                      alt={act.user_name}
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 leading-snug">
                        <span className="font-bold text-slate-900">{act.user_name} </span>
                        {act.action === 'STATUS_CHANGED' && (
                          <span>moved <span className="font-medium text-slate-900">"{detailsObj.taskTitle}"</span> to <span className="font-semibold text-indigo-600">{detailsObj.to}</span></span>
                        )}
                        {act.action === 'TASK_CREATED' && (
                          <span>created task <span className="font-medium text-slate-900">"{detailsObj.taskTitle}"</span></span>
                        )}
                        {act.action === 'TASK_COMPLETED' && (
                          <span className="text-emerald-600 font-semibold">completed "{detailsObj.taskTitle}"</span>
                        )}
                        {act.action === 'COMMENT_ADDED' && (
                          <span>commented on <span className="font-medium text-slate-900">"{detailsObj.taskTitle}"</span></span>
                        )}
                        {act.action === 'PROJECT_CREATED' && (
                          <span>launched new project <span className="font-medium text-indigo-700">"{detailsObj.projectName}"</span></span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="truncate max-w-[120px] font-medium text-slate-500">{act.project_name}</span>
                        <span>•</span>
                        <span className="font-mono">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
