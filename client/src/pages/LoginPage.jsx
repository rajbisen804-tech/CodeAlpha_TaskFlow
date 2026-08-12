import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, User } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-md w-full space-y-6">
        {/* Header & Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">
              TaskFlow <span className="text-indigo-600">Pro</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-xs text-slate-500">
            Sign in to access your collaborative project workspaces
          </p>
        </div>

        {/* 1-Click Demo Accounts Quick Select */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>1-Click Seeded Demo Logins:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('alex@taskflow.dev')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200/80 rounded-xl text-[11px] font-semibold text-indigo-950 transition-all text-center shadow-xs"
            >
              Alex (Lead)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('sarah@taskflow.dev')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200/80 rounded-xl text-[11px] font-semibold text-indigo-950 transition-all text-center shadow-xs"
            >
              Sarah (Design)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('mike@taskflow.dev')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200/80 rounded-xl text-[11px] font-semibold text-indigo-950 transition-all text-center shadow-xs"
            >
              Mike (Dev)
            </button>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-premium space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@taskflow.dev"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
