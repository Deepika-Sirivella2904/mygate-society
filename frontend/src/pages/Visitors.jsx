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
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [gatePassCode, setGatePassCode] = useState('');
  const [verifiedVisitor, setVerifiedVisitor] = useState(null);

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

  const handleVerifyGatePass = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get(`/visitors/verify/${gatePassCode}`);
      setVerifiedVisitor(res.data.visitor);
      alert('Gate pass verified successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid gate pass code');
      setVerifiedVisitor(null);
    }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const formatIndianPhone = (phone) => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add +91 if not present and number starts with valid Indian mobile prefix
    if (!cleaned.startsWith('91') && cleaned.length > 0) {
      // Check if it's a valid Indian mobile number (starts with 6,7,8,9)
      const firstDigit = cleaned[0];
      if (['6', '7', '8', '9'].includes(firstDigit)) {
        cleaned = '91' + cleaned;
      }
    }
    
    // Limit to +91 + 10 digits (total 12 digits with country code)
    if (cleaned.startsWith('91')) {
      cleaned = '91' + cleaned.slice(2).slice(0, 10);
    }
    
    // Format as +91 XXXXX-XXXXX
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    } else {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7, 12)}`;
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatIndianPhone(e.target.value);
    setForm(p => ({ ...p, visitor_phone: formatted }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Visitors</h1>
        <div className="flex gap-2">
          {user?.role === 'security' && (
            <button onClick={() => setShowVerifyForm(!showVerifyForm)} className="btn-secondary flex items-center gap-2">
              <Search className="w-4 h-4" /> Verify Gate Pass
            </button>
          )}
          {user?.role !== 'security' && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Pre-approve Visitor
            </button>
          )}
        </div>
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
              <input 
                value={form.visitor_phone} 
                onChange={handlePhoneChange} 
                className="input-field" 
                placeholder="+91 98765-43210"
                maxLength={13}
              />
              <p className="text-xs text-gray-500 mt-1">Indian mobile: +91 XXXXX-XXXXX (starts with 6,7,8,9)</p>
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
              <input 
                type="date" 
                value={form.expected_date} 
                onChange={set('expected_date')} 
                min={new Date().toISOString().split('T')[0]}
                className="input-field" 
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Create Gate Pass</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Gate Pass Verification Form */}
      {showVerifyForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Verify Gate Pass</h3>
          <form onSubmit={handleVerifyGatePass} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gate Pass Code</label>
              <input 
                type="text" 
                value={gatePassCode} 
                onChange={e => setGatePassCode(e.target.value.toUpperCase())}
                placeholder="Enter gate pass code (e.g., 53OQPN)"
                className="input-field uppercase"
                required 
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Verify Gate Pass</button>
              <button type="button" onClick={() => {
                setShowVerifyForm(false);
                setGatePassCode('');
                setVerifiedVisitor(null);
              }} className="btn-secondary">Cancel</button>
            </div>
          </form>
          
          {/* Verified Visitor Details */}
          {verifiedVisitor && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Verified Visitor Details:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {verifiedVisitor.visitor_name}</p>
                <p><strong>Type:</strong> {verifiedVisitor.visitor_type}</p>
                <p><strong>Phone:</strong> {verifiedVisitor.visitor_phone || 'N/A'}</p>
                <p><strong>Vehicle:</strong> {verifiedVisitor.vehicle_number || 'N/A'}</p>
                <p><strong>Resident:</strong> {verifiedVisitor.resident_name} ({verifiedVisitor.block}-{verifiedVisitor.flat_number})</p>
                <p><strong>Purpose:</strong> {verifiedVisitor.purpose || 'N/A'}</p>
                <p><strong>Status:</strong> <span className="badge bg-blue-100 text-blue-700">{verifiedVisitor.status}</span></p>
              </div>
              {verifiedVisitor.status === 'approved' && (
                <div className="mt-3">
                  <button 
                    onClick={() => handleAction(verifiedVisitor.id, 'checkin')}
                    className="btn-success text-sm py-1.5 px-3 flex items-center gap-1"
                  >
                    <LogIn className="w-4 h-4" /> Check In
                  </button>
                </div>
              )}
            </div>
          )}
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
