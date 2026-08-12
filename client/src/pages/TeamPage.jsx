import React, { useState, useEffect } from 'react';
import { Users, Mail, CheckCircle2, Clock, Award, Sparkles, Search, UserPlus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to load team users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Team Directory ({filteredUsers.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View member workloads, task completion metrics, and collaboration roles.
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-subtle flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading team members...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No team members match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((member) => {
            const assigned = member.assigned_tasks_count || 0;
            const completed = member.completed_tasks_count || 0;
            const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 100;
            const isCurrentUser = member.id === user?.id;

            return (
              <div
                key={member.id}
                className={`bg-white rounded-2xl border ${
                  isCurrentUser ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'
                } shadow-subtle hover:shadow-card transition-all p-6 space-y-4 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <img
                      src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`}
                      alt={member.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
                    />
                    {isCurrentUser && (
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{member.name}</h3>
                    <p className="text-xs font-medium text-indigo-600 mt-0.5">{member.role || 'Member'}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{member.bio}"
                    </p>
                  )}
                </div>

                {/* Performance Metrics */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{assigned}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Assigned</p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-700">{completed}</p>
                      <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Completed</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Task Completion Rate</span>
                    <span className="font-bold text-slate-700">{rate}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
