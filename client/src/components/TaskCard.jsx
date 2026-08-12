import React from 'react';
import { 
  Calendar, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  Flag,
  ArrowRight
} from 'lucide-react';

export default function TaskCard({ task, onOpenDetails, onMoveStatus, onDragStart, onDragEnd }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0)) && task.status !== 'DONE';

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Low':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getPriorityDot = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500';
      case 'High': return 'bg-amber-500';
      case 'Medium': return 'bg-sky-500';
      case 'Low': default: return 'bg-emerald-500';
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onOpenDetails(task)}
      className="group bg-white rounded-xl p-3.5 border border-slate-200 shadow-subtle hover:shadow-card hover:border-indigo-300 transition-all duration-200 cursor-pointer select-none relative"
    >
      {/* Priority & Status indicators */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getPriorityStyle(task.priority)}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(task.priority)}`}></span>
            {task.priority}
          </span>

          {/* Labels */}
          {Array.isArray(task.labels) && task.labels.slice(0, 2).map((label, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md"
            >
              {label}
            </span>
          ))}
          {Array.isArray(task.labels) && task.labels.length > 2 && (
            <span className="text-[10px] font-medium text-slate-400">
              +{task.labels.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors mb-1.5">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>
      )}

      {/* Footer: Due date, comments, assignee avatar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <span
              className={`flex items-center gap-1 text-[11px] font-medium ${
                isOverdue
                  ? 'text-rose-600 font-semibold'
                  : 'text-slate-500'
              }`}
              title={isOverdue ? 'Task is overdue!' : `Due ${task.due_date}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{task.due_date}</span>
            </span>
          )}

          {task.comment_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{task.comment_count}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        <div>
          {task.assignee_id ? (
            <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee_name || 'Team Member'}`}>
              <img
                src={task.assignee_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(task.assignee_name || 'User')}`}
                alt={task.assignee_name}
                className="w-6 h-6 rounded-full ring-2 ring-white object-cover shadow-xs"
              />
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
}
