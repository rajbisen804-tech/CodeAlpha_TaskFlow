import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  UserPlus, 
  Settings, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Kanban,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  X
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import CreateTaskModal from '../components/CreateTaskModal';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'border-t-slate-400', badge: 'bg-slate-100 text-slate-700' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-t-blue-500', badge: 'bg-blue-50 text-blue-700' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'border-t-amber-500', badge: 'bg-amber-50 text-amber-700' },
  { id: 'DONE', title: 'Done', color: 'border-t-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
];

export default function ProjectBoardPage() {
  const { id: projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinProject, leaveProject, addToast } = useSocket();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modals
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createTaskColumn, setCreateTaskColumn] = useState('TODO');
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedAddUserId, setSelectedAddUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Member');

  // Drag and Drop State
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Fetch Project & Tasks
  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
      ]);

      if (projRes.data.success) setProject(projRes.data.project);
      if (tasksRes.data.success) setTasks(tasksRes.data.tasks || []);
    } catch (err) {
      console.error('Failed to load project board:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
    joinProject(projectId);

    // Check if task query param exists (e.g. from notification link)
    const taskParam = searchParams.get('task');
    if (taskParam) {
      setActiveTaskId(taskParam);
    }

    return () => {
      leaveProject(projectId);
    };
  }, [projectId, fetchProjectData, joinProject, leaveProject, searchParams]);

  // Real-time WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === newTask.id);
        if (exists) return prev;
        return [newTask, ...prev];
      });
      addToast({
        title: 'New Task Created',
        message: `Task "${newTask.title}" was added to the board.`,
        type: 'info',
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    };

    const handleTaskStatusChanged = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t.id !== Number(taskId)));
    };

    const handleMemberAdded = ({ user: newMember }) => {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: [...(prev.members || []), newMember]
        };
      });
    };

    const handleMemberRemoved = ({ userId }) => {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members?.filter((m) => m.id !== userId)
        };
      });
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_status_changed', handleTaskStatusChanged);
    socket.on('task_deleted', handleTaskDeleted);
    socket.on('member_added', handleMemberAdded);
    socket.on('member_removed', handleMemberRemoved);

    return () => {
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_status_changed', handleTaskStatusChanged);
      socket.off('task_deleted', handleTaskDeleted);
      socket.off('member_added', handleMemberAdded);
      socket.off('member_removed', handleMemberRemoved);
    };
  }, [socket, addToast]);

  // Handle Drag & Drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask) return;
    if (draggedTask.status === columnId) {
      setDraggedTask(null);
      return;
    }

    const updatedTask = { ...draggedTask, status: columnId };

    // Optimistic UI update
    setTasks((prev) => prev.map((t) => (t.id === draggedTask.id ? updatedTask : t)));

    try {
      await api.patch(`/tasks/${draggedTask.id}/status`, { status: columnId });
    } catch (err) {
      console.error('Failed to move task:', err);
      // Rollback
      fetchProjectData();
    } finally {
      setDraggedTask(null);
    }
  };

  const openCreateInColumn = (columnId) => {
    setCreateTaskColumn(columnId);
    setCreateTaskModalOpen(true);
  };

  const openAddMemberModal = async () => {
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setAllUsers(res.data.users || []);
        setAddMemberModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedAddUserId) return;

    try {
      const res = await api.post(`/projects/${projectId}/members`, {
        userId: Number(selectedAddUserId),
        role: selectedRole,
      });

      if (res.data.success) {
        setProject((prev) => ({
          ...prev,
          members: [...(prev.members || []), res.data.member]
        }));
        setAddMemberModalOpen(false);
        setSelectedAddUserId('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (Array.isArray(t.labels) && t.labels.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    const matchesAssignee =
      assigneeFilter === 'ALL' ||
      (assigneeFilter === 'UNASSIGNED' && !t.assignee_id) ||
      t.assignee_id === Number(assigneeFilter);

    const matchesOverdue =
      !overdueOnly ||
      (t.due_date && new Date(t.due_date) < new Date(new Date().setHours(0,0,0,0)) && t.status !== 'DONE');

    return matchesSearch && matchesPriority && matchesAssignee && matchesOverdue;
  });

  const getTasksByStatus = (status) => {
    return filteredTasks.filter((t) => t.status === status);
  };

  if (loading && !project) {
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading project board...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-5 animate-fadeIn min-h-[calc(100vh-5rem)] flex flex-col">
      {/* Board Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: project?.color || '#4f46e5' }}
                />
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {project?.name}
                </h1>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                  {project?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {project?.description || 'Collaborative Kanban Board'}
              </p>
            </div>
          </div>

          {/* Members & Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Member Avatars */}
            <div className="flex items-center -space-x-1.5 overflow-hidden pr-2">
              {project?.members?.map((m) => (
                <img
                  key={m.id}
                  src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`}
                  alt={m.name}
                  title={`${m.name} (${m.project_role || 'Member'})`}
                  className="w-7 h-7 rounded-full ring-2 ring-white object-cover shadow-xs"
                />
              ))}
            </div>

            <button
              onClick={openAddMemberModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>

            <button
              onClick={() => {
                setCreateTaskColumn('TODO');
                setCreateTaskModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-indigo-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, descriptions, or tags..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 outline-none focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Priority Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none font-medium"
              >
                <option value="ALL">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assignee:</span>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none font-medium"
              >
                <option value="ALL">All Members</option>
                <option value="UNASSIGNED">Unassigned</option>
                {project?.members?.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Overdue Checkbox */}
            <button
              onClick={() => setOverdueOnly(!overdueOnly)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                overdueOnly
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Overdue Only
            </button>

            {(searchQuery || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL' || overdueOnly) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('ALL');
                  setAssigneeFilter('ALL');
                  setOverdueOnly(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const colTasks = getTasksByStatus(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col bg-slate-100/70 rounded-2xl border ${
                isOver ? 'border-indigo-500 bg-indigo-50/40 border-dashed ring-2 ring-indigo-200' : 'border-slate-200/80'
              } p-3.5 transition-all duration-200 min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    {column.title}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${column.badge}`}>
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => openCreateInColumn(column.id)}
                  className="text-slate-400 hover:text-indigo-600 hover:bg-white p-1 rounded-lg transition-colors"
                  title={`Add task to ${column.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks List in Column */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div
                    onClick={() => openCreateInColumn(column.id)}
                    className="h-28 border border-dashed border-slate-300/80 rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-indigo-400 hover:bg-white/60 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-slate-400 mb-1" />
                    <p className="text-xs font-medium text-slate-500">No tasks in {column.title}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5">Drop card or click to add</span>
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onOpenDetails={(task) => setActiveTaskId(task.id)}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal */}
      {activeTaskId && (
        <TaskModal
          taskId={activeTaskId}
          projectMembers={project?.members || []}
          onClose={() => {
            setActiveTaskId(null);
            setSearchParams({});
          }}
          onTaskUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          }}
          onTaskDeleted={(deletedId) => {
            setTasks((prev) => prev.filter((t) => t.id !== Number(deletedId)));
          }}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={Number(projectId)}
        initialStatus={createTaskColumn}
        isOpen={createTaskModalOpen}
        projectMembers={project?.members || []}
        onClose={() => setCreateTaskModalOpen(false)}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [newTask, ...prev]);
        }}
      />

      {/* Add Member Modal */}
      {addMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Add Member to Project
              </h3>
              <button
                onClick={() => setAddMemberModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select Registered User
                </label>
                <select
                  required
                  value={selectedAddUserId}
                  onChange={(e) => setSelectedAddUserId(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="">-- Choose User --</option>
                  {allUsers
                    .filter((u) => !project?.members?.some((pm) => pm.id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) - {u.role}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Project Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="Admin">Admin (Can edit project & manage tasks)</option>
                  <option value="Member">Member (Can create & update tasks)</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddMemberModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
