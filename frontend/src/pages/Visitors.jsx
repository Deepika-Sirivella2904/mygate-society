import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, Check, X, LogIn, LogOut, Search } from 'lucide-react';

export default function Visitors() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ visitor_name: '', visitor_phone: '', visitor_type: 'guest', vehicle_number: '', purpose: '', expected_date: '' });

  const load = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/visitors${params}`);
      setVisitors(res.data.visitors || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visitors', form);
      setShowForm(false);
      setForm({ visitor_name: '', visitor_phone: '', visitor_type: 'guest', vehicle_number: '', purpose: '', expected_date: '' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/visitors/${id}/${action}`);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Visitors</h1>
        {user?.role !== 'security' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Pre-approve Visitor
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'approved', 'checked_in', 'checked_out', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Pre-approve Visitor</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name *</label>
              <input value={form.visitor_name} onChange={set('visitor_name')} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.visitor_phone} onChange={set('visitor_phone')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.visitor_type} onChange={set('visitor_type')} className="input-field">
                <option value="guest">Guest</option>
                <option value="delivery">Delivery</option>
                <option value="cab">Cab</option>
                <option value="service">Service</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input value={form.vehicle_number} onChange={set('vehicle_number')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <input value={form.purpose} onChange={set('purpose')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Date</label>
              <input type="date" value={form.expected_date} onChange={set('expected_date')} className="input-field" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Create Gate Pass</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>
      ) : visitors.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-400">No visitors found</p></div>
      ) : (
        <div className="space-y-3">
          {visitors.map(v => (
            <div key={v.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">{v.visitor_name}</p>
                  <span className={`badge badge-${v.status}`}>{v.status.replace('_', ' ')}</span>
                  <span className="badge bg-gray-100 text-gray-600">{v.visitor_type}</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                  {v.visitor_phone && <span>📞 {v.visitor_phone}</span>}
                  {v.vehicle_number && <span>🚗 {v.vehicle_number}</span>}
                  {v.flat_number && <span>🏠 {v.block}-{v.flat_number}</span>}
                  {v.gate_pass_code && <span>🎫 {v.gate_pass_code}</span>}
                  <span>📅 {new Date(v.created_at).toLocaleDateString()}</span>
                </div>
                {v.purpose && <p className="text-xs text-gray-400 mt-1">{v.purpose}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {v.status === 'pending' && (user?.role !== 'security' || user?.role === 'admin') && (
                  <>
                    <button onClick={() => handleAction(v.id, 'approve')} className="btn-success text-sm py-1.5 px-3 flex items-center gap-1"><Check className="w-4 h-4" /> Approve</button>
                    <button onClick={() => handleAction(v.id, 'reject')} className="btn-danger text-sm py-1.5 px-3 flex items-center gap-1"><X className="w-4 h-4" /> Reject</button>
                  </>
                )}
                {v.status === 'approved' && ['security', 'admin'].includes(user?.role) && (
                  <button onClick={() => handleAction(v.id, 'checkin')} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"><LogIn className="w-4 h-4" /> Check In</button>
                )}
                {v.status === 'checked_in' && ['security', 'admin'].includes(user?.role) && (
                  <button onClick={() => handleAction(v.id, 'checkout')} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"><LogOut className="w-4 h-4" /> Check Out</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
