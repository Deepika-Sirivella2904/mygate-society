import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, Phone, Trash2 } from 'lucide-react';

export default function Emergency() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', service_type: 'other', address: '' });

  const load = async () => {
    try {
      const res = await api.get('/emergency');
      setContacts(res.data.contacts || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/emergency', form);
      setShowForm(false);
      setForm({ name: '', phone: '', service_type: 'other', address: '' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    try { await api.delete(`/emergency/${id}`); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const typeEmoji = { police: '🚔', fire: '🚒', ambulance: '🚑', hospital: '🏥', electrician: '⚡', plumber: '🔧', society_office: '🏢', other: '📞' };
  const typeColor = { police: 'bg-blue-100 border-blue-200', fire: 'bg-red-100 border-red-200', ambulance: 'bg-red-100 border-red-200', hospital: 'bg-green-100 border-green-200', society_office: 'bg-purple-100 border-purple-200' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Emergency Contacts</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Add Emergency Contact</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={form.name} onChange={set('name')} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input value={form.phone} onChange={set('phone')} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select value={form.service_type} onChange={set('service_type')} className="input-field">
                {['police', 'fire', 'ambulance', 'hospital', 'electrician', 'plumber', 'society_office', 'other'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={form.address} onChange={set('address')} className="input-field" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Add Contact</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(c => (
            <div key={c.id} className={`card p-4 border ${typeColor[c.service_type] || 'border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeEmoji[c.service_type] || '📞'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{c.service_type.replace('_', ' ')}</p>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              <a href={`tel:${c.phone}`} className="mt-3 flex items-center gap-2 text-primary-600 font-medium hover:underline">
                <Phone className="w-4 h-4" /> {c.phone}
              </a>
              {c.address && <p className="text-xs text-gray-500 mt-1">{c.address}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
