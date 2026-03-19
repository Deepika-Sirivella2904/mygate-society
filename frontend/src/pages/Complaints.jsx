import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, MessageSquare } from 'lucide-react';

const categories = ['plumbing', 'electrical', 'cleaning', 'security', 'parking', 'noise', 'structural', 'pest_control', 'other'];
const priorities = ['low', 'medium', 'high', 'urgent'];

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: 'other', priority: 'medium' });

  const load = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/complaints${params}`);
      setComplaints(res.data.complaints || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/complaints', form);
      setShowForm(false);
      setForm({ title: '', description: '', category: 'other', priority: 'medium' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/complaints/${id}`, { status });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const priorityColor = { low: 'bg-gray-100 text-gray-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Raise Complaint
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f ? f.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">New Complaint</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="input-field" placeholder="Brief description of the issue" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={form.description} onChange={set('description')} className="input-field" rows={3} placeholder="Detailed description..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={set('category')} className="input-field">
                  {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.priority} onChange={set('priority')} className="input-field">
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Submit Complaint</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>
      ) : complaints.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-400">No complaints found</p></div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{c.title}</h3>
                    <span className={`badge badge-${c.status}`}>{c.status.replace('_', ' ')}</span>
                    <span className={`badge ${priorityColor[c.priority]}`}>{c.priority}</span>
                    <span className="badge bg-gray-100 text-gray-600">{c.category.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    {c.resident_name && <span>By: {c.resident_name}</span>}
                    {c.flat_number && <span>Flat: {c.block}-{c.flat_number}</span>}
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    {c.assigned_to_name && <span>Assigned: {c.assigned_to_name}</span>}
                  </div>
                  {c.resolution_notes && <p className="text-sm text-accent-600 mt-2">Resolution: {c.resolution_notes}</p>}
                </div>
                {user?.role === 'admin' && c.status !== 'closed' && (
                  <div className="flex gap-1 flex-shrink-0">
                    {c.status === 'open' && <button onClick={() => handleStatusChange(c.id, 'in_progress')} className="text-xs btn-primary py-1 px-2">In Progress</button>}
                    {c.status === 'in_progress' && <button onClick={() => handleStatusChange(c.id, 'resolved')} className="text-xs btn-success py-1 px-2">Resolve</button>}
                    {c.status === 'resolved' && <button onClick={() => handleStatusChange(c.id, 'closed')} className="text-xs btn-secondary py-1 px-2">Close</button>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
