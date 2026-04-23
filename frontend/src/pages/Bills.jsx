import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, CreditCard, IndianRupee, X } from 'lucide-react';
import QRCode from 'qrcode';

export default function Bills() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [residents, setResidents] = useState([]);
  const [form, setForm] = useState({ resident_id: '', title: '', description: '', amount: '', bill_type: 'maintenance', due_date: '' });
  const [qrCode, setQrCode] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

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
      const bill = bills.find(b => b.id === id);
      setSelectedBill(bill);
      
      // Generate QR code with payment details
      const paymentDetails = {
        billId: id,
        title: bill.title,
        amount: bill.amount,
        residentId: user.id,
        societyId: user.society_id,
        upiId: 'sdeepika8833@oksbi', // Updated UPI ID
        timestamp: new Date().toISOString()
      };
      
      const qrData = `upi://pay?pa=${paymentDetails.upiId}&pn=MyGate Society&am=${paymentDetails.amount}&cu=INR&tn=${paymentDetails.title}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      setQrCode(qrCodeDataUrl);
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handlePaymentComplete = async () => {
    if (selectedBill) {
      try {
        await api.put(`/bills/${selectedBill.id}/pay`, { payment_method: 'online' });
        setQrCode('');
        setSelectedBill(null);
        load();
      } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    }
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

      {/* QR Code Payment Modal */}
      {qrCode && selectedBill && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Scan QR Code to Pay</h3>
              <button onClick={() => { setQrCode(''); setSelectedBill(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <img src={qrCode} alt="Payment QR Code" className="w-48 h-48" />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">{selectedBill.title}</h4>
                <p className="text-2xl font-bold text-primary-600">Rs. {parseFloat(selectedBill.amount).toLocaleString()}</p>
                <p className="text-sm text-gray-500">UPI ID: sdeepika8833@oksbi</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Instructions:</strong><br/>
                  1. Open any UPI app (PhonePe, GPay, PayTM)<br/>
                  2. Scan the QR code above<br/>
                  3. Confirm payment details<br/>
                  4. Complete payment
                </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handlePaymentComplete}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Payment Completed
                </button>
                <button 
                  onClick={() => { setQrCode(''); setSelectedBill(null); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
