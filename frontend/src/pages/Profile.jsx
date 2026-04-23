import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { User, Save, Lock, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', flat_number: user?.flat_number || '', block: user?.block || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(form);
      setMsg('Profile updated!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.error || 'Failed'); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/password', pwForm);
      setPwMsg('Password changed!');
      setPwForm({ current_password: '', new_password: '' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) { setPwMsg(err.response?.data?.error || 'Failed'); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge bg-primary-100 text-primary-700 mt-1">{user?.role}</span>
          </div>
        </div>

        {msg && <div className={`p-3 rounded-lg text-sm mb-4 ${msg.includes('updated') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input value={form.name} onChange={set('name')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={set('phone')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
              <input value={form.block} onChange={set('block')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
              <input value={form.flat_number} onChange={set('flat_number')} className="input-field" />
            </div>
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-600" /> Change Password
        </h3>
        {pwMsg && <div className={`p-3 rounded-lg text-sm mb-4 ${pwMsg.includes('changed') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{pwMsg}</div>}
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input 
                type={showCurrentPassword ? "text" : "password"} 
                value={pwForm.current_password} 
                onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} 
                className="input-field pr-10" 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"} 
                value={pwForm.new_password} 
                onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} 
                className="input-field pr-10" 
                required 
                minLength={6} 
              />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)} 
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary">Update Password</button>
        </form>
      </div>
    </div>
  );
}
