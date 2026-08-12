import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  CheckCircle2, 
  Kanban, 
  Zap, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  Activity, 
  Sparkles,
  BarChart3,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              TaskFlow <span className="text-indigo-600">Pro</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-all"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CodeAlpha Full Stack Internship Project • Real-Time WebSockets</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Supercharge Team Collaboration with <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 bg-clip-text text-transparent">
              Real-Time Project Workspaces
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            TaskFlow Pro gives modern software engineering teams interactive drag-and-drop Kanban boards, instant live updates, in-task comments, and data-driven dashboards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all flex items-center justify-center gap-2"
            >
              <span>{isAuthenticated ? 'Open Workspace' : 'Try Live Interactive Demo'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-subtle"
            >
              Create Free Account
            </Link>
          </div>

          {/* Quick Demo Preview Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Real SQLite Database</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Socket.IO Real-time Sync</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Interactive Drag & Drop Kanban</span>
            </div>
          </div>
        </div>

        {/* Live Kanban Preview Mockup */}
        <div className="max-w-5xl mx-auto mt-12 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-slate-700 ml-2">TaskFlow Pro • Live Board Demo</span>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> WebSocket Connected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            {/* Column 1 */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700">
                <span>TO DO</span>
                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">2</span>
              </div>
              <div className="space-y-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">Critical</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">Setup CI/CD Automated Tests</p>
                  <p className="text-[11px] text-slate-400 mt-2">Due in 2 days</p>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-blue-700">
                <span>IN PROGRESS</span>
                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">3</span>
              </div>
              <div className="space-y-2.5">
                <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-xs ring-1 ring-indigo-50">
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">High</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">Kanban Drag & Drop Columns</p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 2</span>
                    <span className="text-indigo-600 font-medium">Alex J.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-amber-700">
                <span>IN REVIEW</span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">1</span>
              </div>
              <div className="space-y-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200">Medium</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">Task Comments & Mentions</p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 1</span>
                    <span className="text-slate-600 font-medium">Sarah C.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4 */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-emerald-700">
                <span>DONE</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">4</span>
              </div>
              <div className="space-y-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">Completed</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1 line-through text-slate-400">WebSocket Room Gateway</p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-2">Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Engineered for High-Velocity Product Teams
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Every feature satisfies CodeAlpha Task 3 specifications with production-level craftsmanship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Kanban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Interactive Kanban Board</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                4-column workflow (TODO, IN PROGRESS, IN REVIEW, DONE) with drag & drop, priority filters, due date flags, and assignee pills.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time WebSockets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant task status transitions, comments, and push notifications broadcasted live across multiple teammates without refreshing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">In-Task Communication</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Discuss requirements, post updates, edit replies, and track complete audit logs of every change made to a task.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Real Database Metrics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dynamic charts for task distributions, overdue alerts, project completion percentages, and live activity streams.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Team & Permissions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manage group project memberships, assign task owners, track individual completion rates, and assign roles.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Secure JWT Auth & SQLite</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bcrypt password hashing, token validation, clean relational schema, indexes, and full automated integration test suite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 TaskFlow Pro. CodeAlpha Full Stack Internship Task 3.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-slate-700">Demo Login</Link>
            <Link to="/register" className="hover:text-slate-700">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
