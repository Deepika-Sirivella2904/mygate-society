import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, Pin, Trash2 } from 'lucide-react';

export default function Notices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', priority: 'normal', is_pinned: false });

  const load = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data.notices || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices', form);
      setShowForm(false);
      setForm({ title: '', content: '', category: 'general', priority: 'normal', is_pinned: false });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return;
    try { await api.delete(`/notices/${id}`); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const priorityStyle = { normal: 'border-l-gray-300', important: 'border-l-yellow-400', urgent: 'border-l-red-500' };
  const catBadge = { general: 'bg-gray-100 text-gray-700', maintenance: 'bg-blue-100 text-blue-700', event: 'bg-purple-100 text-purple-700', emergency: 'bg-red-100 text-red-700', payment: 'bg-green-100 text-green-700', rule: 'bg-orange-100 text-orange-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Notices & Announcements</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Post Notice
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">New Notice</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea value={form.content} onChange={set('content')} className="input-field" rows={4} required />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={set('category')} className="input-field">
                  {['general', 'maintenance', 'event', 'emergency', 'payment', 'rule'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.priority} onChange={set('priority')} className="input-field">
                  {['normal', 'important', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))} className="rounded" />
                  <span className="text-sm font-medium text-gray-700">Pin Notice</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Publish</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>
      ) : notices.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-400">No notices</p></div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} className={`card p-4 border-l-4 ${priorityStyle[n.priority] || 'border-l-gray-300'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.is_pinned && <Pin className="w-4 h-4 text-primary-600" />}
                    <h3 className="font-semibold text-gray-900">{n.title}</h3>
                    <span className={`badge ${catBadge[n.category] || 'bg-gray-100 text-gray-700'}`}>{n.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{n.content}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>By: {n.author_name}</span>
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(n.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
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
