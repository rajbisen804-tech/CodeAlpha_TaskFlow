import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Calendar, 
  User, 
  Tag, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  History, 
  Edit3, 
  Send,
  CornerDownRight,
  Clock,
  Sparkles,
  Save
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', color: 'bg-slate-100 text-slate-700' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'IN_REVIEW', label: 'In Review', color: 'bg-amber-100 text-amber-800' },
  { value: 'DONE', label: 'Done', color: 'bg-emerald-100 text-emerald-800' },
];

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export default function TaskModal({ taskId, onClose, onTaskUpdated, onTaskDeleted, projectMembers = [] }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'
  
  // Edit Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tasks/${taskId}`);
      if (res.data.success) {
        const t = res.data.task;
        setTask(t);
        setTitle(t.title);
        setDescription(t.description || '');
        setStatus(t.status);
        setPriority(t.priority);
        setAssigneeId(t.assignee_id ? String(t.assignee_id) : '');
        setDueDate(t.due_date || '');
        setLabels(Array.isArray(t.labels) ? t.labels : []);
      }
    } catch (err) {
      console.error('Failed to load task details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  // Real-time socket events for this task
  useEffect(() => {
    if (!socket || !taskId) return;

    const handleCommentAdded = ({ taskId: cTaskId, comment }) => {
      if (Number(cTaskId) === Number(taskId)) {
        setTask((prev) => {
          if (!prev) return prev;
          const exists = prev.comments?.some((c) => c.id === comment.id);
          if (exists) return prev;
          return {
            ...prev,
            comments: [...(prev.comments || []), comment]
          };
        });
      }
    };

    const handleCommentDeleted = ({ taskId: cTaskId, commentId }) => {
      if (Number(cTaskId) === Number(taskId)) {
        setTask((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments?.filter((c) => c.id !== commentId)
          };
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (Number(updatedTask.id) === Number(taskId)) {
        setTask((prev) => ({
          ...prev,
          ...updatedTask
        }));
      }
    };

    socket.on('comment_added', handleCommentAdded);
    socket.on('comment_deleted', handleCommentDeleted);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_status_changed', handleTaskUpdated);

    return () => {
      socket.off('comment_added', handleCommentAdded);
      socket.off('comment_deleted', handleCommentDeleted);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_status_changed', handleTaskUpdated);
    };
  }, [socket, taskId]);

  const handleSaveTask = async () => {
    try {
      setSaving(true);
      const res = await api.put(`/tasks/${taskId}`, {
        title,
        description,
        status,
        priority,
        assignee_id: assigneeId ? Number(assigneeId) : null,
        due_date: dueDate || null,
        labels,
      });

      if (res.data.success) {
        setTask((prev) => ({ ...prev, ...res.data.task }));
        if (onTaskUpdated) onTaskUpdated(res.data.task);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        if (onTaskUpdated) onTaskUpdated(res.data.task);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/tasks/${taskId}`);
      if (onTaskDeleted) onTaskDeleted(taskId);
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleAddLabel = () => {
    if (newTagInput.trim() && !labels.includes(newTagInput.trim())) {
      const updated = [...labels, newTagInput.trim()];
      setLabels(updated);
      setNewTagInput('');
    }
  };

  const handleRemoveLabel = (labelToRemove) => {
    setLabels(labels.filter((l) => l !== labelToRemove));
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.post('/comments', {
        task_id: taskId,
        content: commentText.trim(),
      });

      if (res.data.success) {
        setCommentText('');
        // Add to local state if socket didn't already
        setTask((prev) => {
          const exists = prev?.comments?.some((c) => c.id === res.data.comment.id);
          if (exists) return prev;
          return {
            ...prev,
            comments: [...(prev?.comments || []), res.data.comment]
          };
        });
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await api.put(`/comments/${commentId}`, {
        content: editCommentText.trim()
      });
      if (res.data.success) {
        setTask((prev) => ({
          ...prev,
          comments: prev.comments.map((c) => (c.id === commentId ? res.data.comment : c))
        }));
        setEditingCommentId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setTask((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== commentId)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Task #{taskId}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {task?.project_name || 'Project'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200 text-xs">
                <span className="text-red-700 px-2 font-medium">Delete task?</span>
                <button
                  onClick={handleDeleteTask}
                  className="px-2 py-1 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Yes
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2 py-1 bg-white text-slate-600 rounded-lg border hover:bg-slate-50"
                >
                  No
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading task data...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Main Content Area (2 Cols) */}
            <div className="lg:col-span-2 p-6 space-y-6">
              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg font-bold text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 transition-all outline-none"
                  placeholder="Task title..."
                />
              </div>

              {/* Description input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm text-slate-700 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 transition-all outline-none resize-none leading-relaxed"
                  placeholder="Add detailed task instructions, requirements, or links..."
                />
              </div>

              {/* Labels Editor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Labels & Tags
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {labels.map((label, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100"
                    >
                      {label}
                      <button
                        onClick={() => handleRemoveLabel(label)}
                        className="text-indigo-400 hover:text-indigo-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLabel();
                        }
                      }}
                      placeholder="+ Add tag..."
                      className="text-xs bg-slate-100 border border-transparent focus:border-indigo-300 focus:bg-white rounded-lg px-2.5 py-1 outline-none w-24 focus:w-32 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Save Task Changes Button */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={handleSaveTask}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

              {/* Tabs: Comments vs Activity */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-2 mb-4">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-2 text-xs font-bold pb-1 transition-colors border-b-2 ${
                      activeTab === 'comments'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Comments ({task?.comments?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 text-xs font-bold pb-1 transition-colors border-b-2 ${
                      activeTab === 'activity'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Activity History ({task?.activities?.length || 0})</span>
                  </button>
                </div>

                {/* Tab 1: Comments */}
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {/* Add Comment Input */}
                    <form onSubmit={handlePostComment} className="flex gap-3 items-start">
                      <img
                        src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Me')}`}
                        alt={user?.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 mt-1 shrink-0"
                      />
                      <div className="flex-1">
                        <textarea
                          rows={2}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a message or update for your team..."
                          className="w-full text-xs text-slate-700 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl p-3 outline-none resize-none transition-all"
                        />
                        <div className="flex justify-end mt-1.5">
                          <button
                            type="submit"
                            disabled={submittingComment || !commentText.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg disabled:opacity-40 transition-colors shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>{submittingComment ? 'Posting...' : 'Comment'}</span>
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-3 pt-2">
                      {task?.comments?.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">No comments yet. Start the conversation!</p>
                      ) : (
                        task?.comments?.map((c) => (
                          <div key={c.id} className="flex gap-3 group p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                            <img
                              src={c.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.author_name || 'User')}`}
                              alt={c.author_name}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800">{c.author_name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {c.user_id === user?.id && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(c.id);
                                        setEditCommentText(c.content);
                                      }}
                                      className="text-slate-400 hover:text-slate-700 p-1"
                                      title="Edit"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(c.id)}
                                      className="text-slate-400 hover:text-red-600 p-1"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {editingCommentId === c.id ? (
                                <div className="mt-2">
                                  <input
                                    type="text"
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    className="w-full text-xs p-2 bg-white border border-indigo-400 rounded-lg outline-none"
                                  />
                                  <div className="flex gap-2 justify-end mt-1.5">
                                    <button
                                      onClick={() => setEditingCommentId(null)}
                                      className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-200 rounded"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleUpdateComment(c.id)}
                                      className="px-2.5 py-1 text-[11px] bg-indigo-600 text-white rounded font-medium"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-700 mt-1 leading-relaxed break-words">{c.content}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Activity Trail */}
                {activeTab === 'activity' && (
                  <div className="space-y-3 py-2">
                    {task?.activities?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No activity logged yet.</p>
                    ) : (
                      task?.activities?.map((act) => {
                        let detailsObj = {};
                        try {
                          detailsObj = JSON.parse(act.details || '{}');
                        } catch(e) {}

                        return (
                          <div key={act.id} className="flex items-start gap-2.5 text-xs text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                            <div className="flex-1">
                              <span className="font-semibold text-slate-800">{act.user_name} </span>
                              {act.action === 'STATUS_CHANGED' && (
                                <span>
                                  changed status from <span className="font-medium text-slate-900">{detailsObj.from}</span> to <span className="font-medium text-indigo-700">{detailsObj.to}</span>
                                </span>
                              )}
                              {act.action === 'TASK_CREATED' && <span>created this task</span>}
                              {act.action === 'TASK_UPDATED' && <span>updated task details</span>}
                              {act.action === 'COMMENT_ADDED' && <span>commented on this task</span>}
                              <span className="text-[11px] text-slate-400 ml-2 font-mono">
                                {new Date(act.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Meta Controls (1 Col) */}
            <div className="p-6 bg-slate-50/50 space-y-6">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStatusChange(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        status === opt.value
                          ? `${opt.color} border-current shadow-xs`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 shadow-xs"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p} Priority</option>
                  ))}
                </select>
              </div>

              {/* Assignee Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 shadow-xs"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.project_role || m.role || 'Member'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              {/* Creator Metadata */}
              <div className="pt-4 border-t border-slate-200/80 text-xs text-slate-400 space-y-1.5">
                <p>Created by: <span className="text-slate-700 font-medium">{task?.creator_name || 'System'}</span></p>
                <p>Created on: <span className="text-slate-700 font-mono">{task?.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}</span></p>
                <p>Last updated: <span className="text-slate-700 font-mono">{task?.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'N/A'}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
