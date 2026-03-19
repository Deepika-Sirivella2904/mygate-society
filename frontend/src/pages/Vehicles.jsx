import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, Trash2, Car } from 'lucide-react';

export default function Vehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle_number: '', vehicle_type: 'car', make: '', model: '', color: '', parking_slot: '' });

  const load = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data.vehicles || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', form);
      setShowForm(false);
      setForm({ vehicle_number: '', vehicle_type: 'car', make: '', model: '', color: '', parking_slot: '' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this vehicle?')) return;
    try { await api.delete(`/vehicles/${id}`); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const typeEmoji = { car: '🚗', bike: '🏍️', scooter: '🛵', bicycle: '🚲', other: '🚙' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Registry</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Register Vehicle</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
              <input value={form.vehicle_number} onChange={set('vehicle_number')} className="input-field" placeholder="TS09AB1234" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select value={form.vehicle_type} onChange={set('vehicle_type')} className="input-field">
                {['car', 'bike', 'scooter', 'bicycle', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input value={form.make} onChange={set('make')} className="input-field" placeholder="Hyundai" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input value={form.model} onChange={set('model')} className="input-field" placeholder="Creta" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input value={form.color} onChange={set('color')} className="input-field" placeholder="White" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parking Slot</label>
              <input value={form.parking_slot} onChange={set('parking_slot')} className="input-field" placeholder="A-12" />
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
      ) : vehicles.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-400">No vehicles registered</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(v => (
            <div key={v.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeEmoji[v.vehicle_type] || '🚙'}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{v.vehicle_number}</h3>
                    <span className="badge bg-blue-100 text-blue-700">{v.vehicle_type}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(v.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {(v.make || v.model) && <p>{[v.make, v.model].filter(Boolean).join(' ')}</p>}
                {v.color && <p>Color: {v.color}</p>}
                {v.parking_slot && <p>Parking: {v.parking_slot}</p>}
                {v.owner_name && <p>Owner: {v.owner_name} ({v.block}-{v.flat_number})</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
