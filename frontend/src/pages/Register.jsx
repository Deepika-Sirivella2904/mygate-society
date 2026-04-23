import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

// Demo society for verification
const DEMO_SOCIETY = { id: 'GREEN-001', name: 'Green Valley Society' };

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', flat_number: '', block: '', society_id: '', role: 'resident' });
  const [societies, setSocieties] = useState([]);
  const [verificationStep, setVerificationStep] = useState(1);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (verificationStep === 1) {
      // Verify society first
      if (!form.society_id) {
        setError('Please enter a valid society ID');
        return;
      }
      try {
        // Dummy society verification
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (form.society_id === DEMO_SOCIETY.id) {
          setForm(prev => ({ ...prev, society_name: DEMO_SOCIETY.name }));
          setVerificationStep(2);
        } else {
          setError('Invalid society ID. Use: GREEN-001');
        }
      } catch (err) {
        setError('Society verification failed');
      }
      return;
    }
    
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">MyGate</h1>
          <p className="text-primary-200 mt-1">Society Management Platform</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {verificationStep === 1 ? 'Verify Society' : `Register for ${form.society_name || 'Society'}`}
            </h2>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {verificationStep === 1 ? (
              // Step 1: Society Verification
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Society ID</label>
                <input 
                  value={form.society_id} 
                  onChange={set('society_id')} 
                  className="input-field" 
                  placeholder="Enter your society ID" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => {
                    if (form.society_id) {
                      setVerificationStep(2);
                    } else {
                      setError('Please enter a valid society ID');
                    }
                  }} 
                  className="btn-primary w-full py-3"
                >
                  Verify Society
                </button>
              </div>
            ) : (
              // Step 2: Registration Form
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input value={form.name} onChange={set('name')} className="input-field" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={set('email')} className="input-field" placeholder="john@example.com" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={form.password} onChange={set('password')} className="input-field" placeholder="Min 6 characters" required minLength={6} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input value={form.phone} onChange={set('phone')} className="input-field" placeholder="9876543210" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                    <input value={form.block} onChange={set('block')} className="input-field" placeholder="A" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
                  <input value={form.flat_number} onChange={set('flat_number')} className="input-field" placeholder="101" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </>
            )}
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
