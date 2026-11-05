import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { MOCK_USERS } from '../mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cs_user');
    return saved ? JSON.parse(saved) : MOCK_USERS[0]; // Default to Admin for full demo access
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('cs_access_token', data.accessToken);
      localStorage.setItem('cs_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const data = await api.register(formData);
      localStorage.setItem('cs_access_token', data.accessToken);
      localStorage.setItem('cs_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cs_access_token');
    localStorage.removeItem('cs_user');
    setUser(null);
  };

  const switchRole = (role) => {
    const targetUser = MOCK_USERS.find((u) => u.role === role) || {
      id: `u-${role}`,
      name: role === 'admin' ? 'Super Admin' : role === 'department' ? 'Municipal Officer' : 'Citizen Rahul',
      email: `${role}@civic.in`,
      role: role,
      department_id: role === 'department' ? 'a1000000-0000-0000-0000-000000000001' : null,
    };
    localStorage.setItem('cs_access_token', `mock_${role}_token`);
    localStorage.setItem('cs_user', JSON.stringify(targetUser));
    setUser(targetUser);
  };

  const isAdmin = user?.role === 'admin';
  const isDeptOfficer = user?.role === 'department' || user?.role === 'admin';
  const isCitizen = user?.role === 'citizen';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchRole,
        isAdmin,
        isDeptOfficer,
        isCitizen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
