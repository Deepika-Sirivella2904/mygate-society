import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Building2 } from 'lucide-react';

export default function Residents() {
  const { user } = useAuth();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/society/residents');
        setResidents(res.data.residents || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const roleColor = { admin: 'bg-purple-100 text-purple-700', resident: 'bg-blue-100 text-blue-700', security: 'bg-orange-100 text-orange-700' };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Residents Directory</h1>
        <span className="badge bg-gray-100 text-gray-700">{residents.length} members</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 font-medium text-gray-600">Flat</th>
              <th className="px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {residents.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-600">{r.block && r.flat_number ? `${r.block}-${r.flat_number}` : '-'}</td>
                <td className="px-4 py-3"><span className={`badge ${roleColor[r.role] || ''}`}>{r.role}</span></td>
                <td className="px-4 py-3 text-gray-600">{r.phone || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{r.email}</td>
                <td className="px-4 py-3">{r.is_active ? <span className="badge bg-green-100 text-green-700">Active</span> : <span className="badge bg-red-100 text-red-700">Inactive</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
