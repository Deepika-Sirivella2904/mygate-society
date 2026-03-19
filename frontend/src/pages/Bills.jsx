import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, CreditCard, IndianRupee } from 'lucide-react';

export default function Bills() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [residents, setResidents] = useState([]);
  const [form, setForm] = useState({ resident_id: '', title: '', description: '', amount: '', bill_type: 'maintenance', due_date: '' });

  const load = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/bills${params}`);
      setBills(res.data.bills || []);
      if (user?.role === 'admin') {
        const r = await api.get('/society/residents');
        setResidents(r.data.residents?.filter(x => x.role === 'resident') || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bills', { ...form, amount: parseFloat(form.amount) });
      setShowForm(false);
      setForm({ resident_id: '', title: '', description: '', amount: '', bill_type: 'maintenance', due_date: '' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handlePay = async (id) => {
    try {
      await api.put(`/bills/${id}/pay`, { payment_method: 'online' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const typeEmoji = { maintenance: '🏠', water: '💧', electricity: '⚡', parking: '🅿️', amenity: '🏊', penalty: '⚠️', other: '📋' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Bills & Payments</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Bill
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'paid', 'overdue', 'waived'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {showForm && user?.role === 'admin' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Create New Bill</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resident *</label>
              <select value={form.resident_id} onChange={set('resident_id')} className="input-field" required>
                <option value="">Select resident</option>
                {residents.map(r => <option key={r.id} value={r.id}>{r.name} ({r.block}-{r.flat_number})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.) *</label>
              <input type="number" value={form.amount} onChange={set('amount')} className="input-field" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.bill_type} onChange={set('bill_type')} className="input-field">
                {['maintenance', 'water', 'electricity', 'parking', 'amenity', 'penalty', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="date" value={form.due_date} onChange={set('due_date')} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input value={form.description} onChange={set('description')} className="input-field" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Create Bill</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>
      ) : bills.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-400">No bills found</p></div>
      ) : (
        <div className="space-y-3">
          {bills.map(b => (
            <div key={b.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{typeEmoji[b.bill_type] || '📋'}</span>
                  <h3 className="font-medium text-gray-900">{b.title}</h3>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                  <span className="badge bg-gray-100 text-gray-600">{b.bill_type}</span>
                </div>
                <div className="flex gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                  <span className="font-semibold text-gray-900 flex items-center gap-1"><IndianRupee className="w-4 h-4" />{parseFloat(b.amount).toLocaleString()}</span>
                  <span>Due: {new Date(b.due_date).toLocaleDateString()}</span>
                  {b.resident_name && <span>{b.resident_name} ({b.block}-{b.flat_number})</span>}
                  {b.paid_at && <span className="text-accent-600">Paid: {new Date(b.paid_at).toLocaleDateString()}</span>}
                </div>
              </div>
              {b.status === 'pending' && user?.role === 'resident' && (
                <button onClick={() => handlePay(b.id)} className="btn-success flex items-center gap-2 flex-shrink-0">
                  <CreditCard className="w-4 h-4" /> Pay Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
