import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, CalendarDays, Clock, MapPin, Users, IndianRupee } from 'lucide-react';

export default function Amenities() {
  const { user } = useAuth();
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingFor, setBookingFor] = useState(null);
  const [bookForm, setBookForm] = useState({ booking_date: '', start_time: '', end_time: '', notes: '' });

  const load = async () => {
    try {
      const res = await api.get('/amenities');
      setAmenities(res.data.amenities || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/amenities/${bookingFor}/book`, bookForm);
      alert('Booked successfully!');
      setBookingFor(null);
      setBookForm({ booking_date: '', start_time: '', end_time: '', notes: '' });
    } catch (err) { alert(err.response?.data?.error || 'Booking failed'); }
  };

  const set = (k) => (e) => setBookForm(p => ({ ...p, [k]: e.target.value }));

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Amenities</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {amenities.map(a => (
          <div key={a.id} className="card hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900">{a.name}</h3>
            {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
            <div className="mt-3 space-y-1.5 text-sm text-gray-600">
              {a.location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{a.location}</p>}
              {a.capacity && <p className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />Capacity: {a.capacity}</p>}
              <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{a.open_time?.slice(0,5)} - {a.close_time?.slice(0,5)}</p>
              {parseFloat(a.charge_per_hour) > 0 && <p className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-gray-400" />Rs. {a.charge_per_hour}/hour</p>}
            </div>
            {a.booking_required && (
              <button onClick={() => setBookingFor(a.id)} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                <CalendarDays className="w-4 h-4" /> Book Now
              </button>
            )}
            {!a.booking_required && <p className="text-xs text-accent-600 font-medium mt-3">No booking required — walk in!</p>}
          </div>
        ))}
      </div>

      {amenities.length === 0 && <div className="card text-center py-12"><p className="text-gray-400">No amenities available</p></div>}

      {/* Booking Modal */}
      {bookingFor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setBookingFor(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Book Amenity</h3>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={bookForm.booking_date} onChange={set('booking_date')} className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input type="time" value={bookForm.start_time} onChange={set('start_time')} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input type="time" value={bookForm.end_time} onChange={set('end_time')} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={bookForm.notes} onChange={set('notes')} className="input-field" rows={2} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Confirm Booking</button>
                <button type="button" onClick={() => setBookingFor(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
