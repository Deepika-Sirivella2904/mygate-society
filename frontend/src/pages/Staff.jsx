import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, UserCheck, UserX, Clock } from 'lucide-react';

const staffTypes = ['maid', 'driver', 'cook', 'gardener', 'plumber', 'electrician', 'security', 'other'];

export default function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', staff_type: 'maid', is_verified: false });

  const load = async () => {
    try {
      const params = filter ? `?type=${filter}` : '';
      const res = await api.get(`/staff${params}`);
      setStaff(res.data.staff || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff', form);
      setShowForm(false);
      setForm({ name: '', phone: '', staff_type: 'maid', is_verified: false });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleAssign = async (staffId) => {
    try {
      await api.post(`/staff/${staffId}/assign`, {});
      alert('Staff assigned to you!');
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleAttendance = async (staffId) => {
    try {
      await api.post(`/staff/${staffId}/attendance`, {});
      alert('Attendance marked!');
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const typeEmoji = { maid: '🧹', driver: '🚗', cook: '🍳', gardener: '🌱', plumber: '🔧', electrician: '⚡', security: '🛡️', other: '👤' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Register Staff
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filter ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All
        </button>
        {staffTypes.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {typeEmoji[t]} {t}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Register New Staff</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={form.name} onChange={set('name')} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={set('phone')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.staff_type} onChange={set('staff_type')} className="input-field">
                {staffTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_verified} onChange={e => setForm(p => ({ ...p, is_verified: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium text-gray-700">ID Verified</span>
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Register</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>
      ) : staff.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-400">No staff registered</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-xl">
                  {typeEmoji[s.staff_type] || '👤'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{s.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge bg-blue-100 text-blue-700">{s.staff_type}</span>
                    {s.is_verified ? (
                      <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><UserCheck className="w-3 h-3" />Verified</span>
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-700 flex items-center gap-1"><UserX className="w-3 h-3" />Unverified</span>
                    )}
                  </div>
                </div>
              </div>
              {s.phone && <p className="text-sm text-gray-500 mt-2">📞 {s.phone}</p>}
              <div className="flex gap-2 mt-3">
                {user?.role === 'resident' && (
                  <button onClick={() => handleAssign(s.id)} className="btn-primary text-sm py-1.5 flex-1">Assign to Me</button>
                )}
                {['security', 'admin'].includes(user?.role) && (
                  <button onClick={() => handleAttendance(s.id)} className="btn-success text-sm py-1.5 flex-1 flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4" /> Mark Entry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
