import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Demo users for authentication
const DEMO_USERS = [
  { id: 1, name: 'Deepika Admin', email: 'deepika@greenvalley.com', password: 'password123', role: 'admin', phone: '9876543210', flat_number: 'Admin Office', block: 'A', society_id: 'GREEN-001' },
  { id: 2, name: 'Rahul Resident', email: 'rahul@greenvalley.com', password: 'password123', role: 'resident', phone: '9876543211', flat_number: '101', block: 'A', society_id: 'GREEN-001' },
  { id: 3, name: 'Security Guard', email: 'security@greenvalley.com', password: 'password123', role: 'security', phone: '9876543212', flat_number: 'Security Room', block: 'Gate', society_id: 'GREEN-001' }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      // Restore user from token if available
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        logout();
      }
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check demo users
      const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
      
      if (demoUser) {
        const userData = { ...demoUser };
        delete userData.password;
        const fakeToken = 'demo-token-' + Date.now();
        
        setUser(userData);
        setToken(fakeToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', fakeToken);
        return { user: userData, token: fakeToken };
      } else {
        throw new Error('Invalid email or password');
      }
    } finally { setLoading(false); }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if email already exists
      if (DEMO_USERS.find(u => u.email === data.email)) {
        throw new Error('Email already registered');
      }
      
      // Create new user
      const newUser = {
        id: DEMO_USERS.length + 1,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'resident',
        phone: data.phone,
        flat_number: data.flat_number,
        block: data.block,
        society_id: data.society_id
      };
      
      DEMO_USERS.push(newUser);
      
      const userData = { ...newUser };
      delete userData.password;
      const fakeToken = 'demo-token-' + Date.now();
      
      setUser(userData);
      setToken(fakeToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', fakeToken);
      return { user: userData, token: fakeToken };
    } finally { setLoading(false); }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateProfile = async (data) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
