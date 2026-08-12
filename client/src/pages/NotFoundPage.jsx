import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-4">
        <Layers className="w-6 h-6" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
      <p className="text-sm font-semibold text-slate-600 mt-1">Page Not Found</p>
      <p className="text-xs text-slate-400 max-w-sm mt-2">
        The workspace or board you requested does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-indigo-700 flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
