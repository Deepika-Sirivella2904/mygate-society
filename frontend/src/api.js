import axios from 'axios';

// Demo mode - use mock API instead of real backend
const DEMO_MODE = true;

// Mock data for demo
const MOCK_DATA = {
  notices: [
    { id: 1, title: 'Annual General Meeting', content: 'AGM will be held on 25th April at 6 PM in the community hall.', created_at: '2024-04-20T10:00:00Z' },
    { id: 2, title: 'Water Tank Maintenance', content: 'Water tank maintenance scheduled for this weekend. Please store water accordingly.', created_at: '2024-04-18T14:30:00Z' },
    { id: 3, title: 'Security Alert', content: 'Please ensure your gate passes are updated. Report any suspicious activity immediately.', created_at: '2024-04-15T09:00:00Z' }
  ],
  visitors: [
    { id: 1, name: 'John Smith', purpose: 'Delivery', contact: '9876543210', status: 'approved', gate_pass_code: 'GP001', created_at: '2024-04-20T10:00:00Z' },
    { id: 2, name: 'Sarah Johnson', purpose: 'Visit', contact: '9876543211', status: 'pending', gate_pass_code: 'GP002', created_at: '2024-04-20T11:00:00Z' }
  ],
  complaints: [
    { id: 1, title: 'Water Leakage', description: 'Water leakage in corridor of Block A', status: 'pending', created_at: '2024-04-19T10:00:00Z' },
    { id: 2, title: 'Lift Not Working', description: 'Lift in Block B is not working', status: 'resolved', created_at: '2024-04-18T15:00:00Z' }
  ],
  bills: [
    { id: 1, title: 'Maintenance Fee', amount: 2500, due_date: '2024-04-30', status: 'unpaid', created_at: '2024-04-01T00:00:00Z' },
    { id: 2, title: 'Water Bill', amount: 500, due_date: '2024-04-25', status: 'paid', created_at: '2024-04-01T00:00:00Z' }
  ],
  amenities: [
    { id: 1, name: 'Swimming Pool', capacity: 20, available: true },
    { id: 2, name: 'Tennis Court', capacity: 4, available: true },
    { id: 3, name: 'Community Hall', capacity: 50, available: false }
  ],
  emergency: [
    { id: 1, type: 'Medical', description: 'Emergency ambulance required', status: 'resolved', contact: '9876543210', created_at: '2024-04-20T12:00:00Z' }
  ],
  vehicles: [
    { id: 1, owner_name: 'Rahul', vehicle_number: 'KA-01-AB-1234', vehicle_type: 'Car', flat_number: '101', block: 'A' },
    { id: 2, owner_name: 'Deepika', vehicle_number: 'KA-01-CD-5678', vehicle_type: 'Bike', flat_number: '102', block: 'A' }
  ],
  staff: [
    { id: 1, name: 'Raj Kumar', role: 'Security', phone: '9876543210', status: 'active' },
    { id: 2, name: 'Suresh', role: 'Cleaner', phone: '9876543211', status: 'active' }
  ],
  residents: [
    { id: 1, name: 'Rahul', email: 'rahul@greenvalley.com', flat_number: '101', block: 'A', phone: '9876543210' },
    { id: 2, name: 'Deepika', email: 'deepika@greenvalley.com', flat_number: '102', block: 'A', phone: '9876543211' }
  ]
};

// Mock API handler
const mockApi = {
  async get(url) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (url.includes('/notices')) return { data: MOCK_DATA.notices };
    if (url.includes('/visitors')) return { data: MOCK_DATA.visitors };
    if (url.includes('/complaints')) return { data: MOCK_DATA.complaints };
    if (url.includes('/bills')) return { data: MOCK_DATA.bills };
    if (url.includes('/amenities')) return { data: MOCK_DATA.amenities };
    if (url.includes('/emergency')) return { data: MOCK_DATA.emergency };
    if (url.includes('/vehicles')) return { data: MOCK_DATA.vehicles };
    if (url.includes('/staff')) return { data: MOCK_DATA.staff };
    if (url.includes('/residents')) return { data: MOCK_DATA.residents };
    if (url.includes('/dashboard')) return { data: { stats: { visitors: 5, complaints: 2, bills: 2 } } };
    
    return { data: [] };
  },
  
  async post(url, data) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { ...data, id: Date.now() } };
  },
  
  async put(url, data) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { ...data } };
  },
  
  async delete(url) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: { success: true } };
  }
};

// Create API instance
let api;
if (DEMO_MODE) {
  api = mockApi;
} else {
  api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: { 'Content-Type': 'application/json' },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  );
}

export default api;
