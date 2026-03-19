import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Users, CalendarDays, MessageSquare, Megaphone,
  UserCog, Receipt, Phone, Car, User, LogOut, Menu, X, Shield, Building2
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard', roles: ['admin', 'resident', 'security'] },
  { to: '/visitors', icon: Users, label: 'Visitors', roles: ['admin', 'resident', 'security'] },
  { to: '/amenities', icon: CalendarDays, label: 'Amenities', roles: ['admin', 'resident'] },
  { to: '/complaints', icon: MessageSquare, label: 'Complaints', roles: ['admin', 'resident'] },
  { to: '/notices', icon: Megaphone, label: 'Notices', roles: ['admin', 'resident', 'security'] },
  { to: '/staff', icon: UserCog, label: 'Staff', roles: ['admin', 'resident', 'security'] },
  { to: '/bills', icon: Receipt, label: 'Bills', roles: ['admin', 'resident'] },
  { to: '/emergency', icon: Phone, label: 'Emergency', roles: ['admin', 'resident', 'security'] },
  { to: '/vehicles', icon: Car, label: 'Vehicles', roles: ['admin', 'resident'] },
  { to: '/residents', icon: Building2, label: 'Residents', roles: ['admin', 'security'] },
  { to: '/profile', icon: User, label: 'Profile', roles: ['admin', 'resident', 'security'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = navItems.filter(n => n.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = { admin: 'bg-purple-100 text-purple-700', resident: 'bg-blue-100 text-blue-700', security: 'bg-orange-100 text-orange-700' };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">MyGate</h1>
            <p className="text-xs text-gray-500">Society Management</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${roleColors[user?.role] || ''}`}>{user?.role}</span>
            {user?.flat_number && <span className="text-xs text-gray-500">{user?.block}-{user?.flat_number}</span>}
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {filtered.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">MyGate Society Management</h2>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
