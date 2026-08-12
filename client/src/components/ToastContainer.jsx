import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useSocket();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let bgClass = 'bg-slate-900 border-slate-700 text-white';

        if (toast.type === 'success' || toast.type === 'task_completed') {
          Icon = CheckCircle2;
          bgClass = 'bg-emerald-900/90 border-emerald-500/50 text-white backdrop-blur-md';
        } else if (toast.type === 'warning' || toast.type === 'status_changed') {
          Icon = AlertTriangle;
          bgClass = 'bg-amber-900/90 border-amber-500/50 text-white backdrop-blur-md';
        } else if (toast.type === 'task_assigned' || toast.type === 'project_added') {
          Icon = Bell;
          bgClass = 'bg-indigo-900/90 border-indigo-500/50 text-white backdrop-blur-md';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 ${bgClass}`}
          >
            <div className="p-1 rounded-lg bg-white/10 shrink-0 mt-0.5">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
              <p className="text-xs text-slate-200 mt-0.5 line-clamp-2 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
