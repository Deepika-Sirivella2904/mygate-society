import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Visitors from './pages/Visitors';
import Amenities from './pages/Amenities';
import Complaints from './pages/Complaints';
import Notices from './pages/Notices';
import Staff from './pages/Staff';
import Bills from './pages/Bills';
import Emergency from './pages/Emergency';
import Vehicles from './pages/Vehicles';
import Profile from './pages/Profile';
import Residents from './pages/Residents';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="amenities" element={<Amenities />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="notices" element={<Notices />} />
        <Route path="staff" element={<Staff />} />
        <Route path="bills" element={<Bills />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="profile" element={<Profile />} />
        <Route path="residents" element={<Residents />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
