import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Users, MessageSquare, Receipt, Megaphone, UserCheck, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [noticeRes, visitorRes] = await Promise.all([
          api.get('/notices'),
          api.get('/visitors?status=pending'),
        ]);
        setNotices(noticeRes.data.notices?.slice(0, 5) || []);
        setVisitors(visitorRes.data.visitors?.slice(0, 5) || []);

        if (user?.role === 'admin') {
          const dashRes = await api.get('/society/dashboard');
          setDashboard(dashRes.data.dashboard);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-500 mt-1">
          {user?.role === 'admin' ? 'Society Admin Dashboard' :
           user?.role === 'security' ? 'Security Dashboard' : `Flat ${user?.block}-${user?.flat_number}`}
        </p>
      </div>

      {/* Admin Stats */}
      {user?.role === 'admin' && dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Total Residents" value={dashboard.users?.resident || 0} color="bg-primary-600" sub={`${dashboard.users?.security || 0} security`} />
          <StatCard icon={Users} label="Visitors Today" value={Object.values(dashboard.visitors_today || {}).reduce((a, b) => a + b, 0)} color="bg-accent-600" />
          <StatCard icon={MessageSquare} label="Open Complaints" value={dashboard.complaints?.open || 0} color="bg-orange-500" sub={`${dashboard.complaints?.in_progress || 0} in progress`} />
          <StatCard icon={Receipt} label="Pending Bills" value={dashboard.bills?.pending?.count || 0} color="bg-red-500" sub={`Rs. ${(dashboard.bills?.pending?.total || 0).toLocaleString()}`} />
        </div>
      )}

      {/* Resident/Security Quick Stats */}
      {user?.role !== 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Pending Visitors" value={visitors.length} color="bg-primary-600" />
          <StatCard icon={Megaphone} label="Notices" value={notices.length} color="bg-accent-600" />
          <StatCard icon={UserCheck} label="Your Role" value={user?.role} color="bg-purple-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Visitors */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Pending Visitors
          </h3>
          {visitors.length === 0 ? (
            <p className="text-gray-400 text-sm">No pending visitors</p>
          ) : (
            <div className="space-y-3">
              {visitors.map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.visitor_name}</p>
                    <p className="text-xs text-gray-500">{v.visitor_type} {v.flat_number ? `• ${v.block}-${v.flat_number}` : ''}</p>
                  </div>
                  <span className="badge badge-pending">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Notices */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-accent-600" />
            Latest Notices
          </h3>
          {notices.length === 0 ? (
            <p className="text-gray-400 text-sm">No notices</p>
          ) : (
            <div className="space-y-3">
              {notices.map(n => (
                <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {n.is_pinned && <span className="text-xs">📌</span>}
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
