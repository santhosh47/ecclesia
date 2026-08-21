import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  activeRole: string;
  login: (username: string, password: string) => Promise<User>;
  loginAsDemoRole: (username: string, password?: string) => Promise<User>;
  logout: () => void;
  setActiveRoleOverride: (role: string) => void;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isSuperAdmin: false,
  activeRole: 'super_admin',
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  loginAsDemoRole: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: () => {},
  setActiveRoleOverride: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ecclesia_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [activeRoleOverride, setActiveRoleOverrideState] = useState<string | null>(() => {
    return localStorage.getItem('ecclesia_active_role_override');
  });

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'super_admin';

  // If user is super admin and chose an override role preview, use that; otherwise use assigned user.role
  const activeRole = isSuperAdmin && activeRoleOverride ? activeRoleOverride : user?.role || 'super_admin';

  const login = async (username: string, password: string): Promise<User> => {
    const res = await api.login({ username, password });
    setUser(res.user);
    localStorage.setItem('ecclesia_auth_user', JSON.stringify(res.user));
    localStorage.setItem('ecclesia_auth_token', res.access_token);
    setActiveRoleOverrideState(null);
    localStorage.removeItem('ecclesia_active_role_override');
    return res.user;
  };

  const loginAsDemoRole = async (username: string, password: string = `${username}123`): Promise<User> => {
    return login(username, password);
  };

  const logout = () => {
    api.logout().catch(() => {});
    setUser(null);
    setActiveRoleOverrideState(null);
    localStorage.removeItem('ecclesia_auth_user');
    localStorage.removeItem('ecclesia_auth_token');
    localStorage.removeItem('ecclesia_active_role_override');
  };

  const setActiveRoleOverride = (role: string) => {
    if (!isSuperAdmin) return; // Only super admin can simulate roles
    setActiveRoleOverrideState(role);
    localStorage.setItem('ecclesia_active_role_override', role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isSuperAdmin,
        activeRole,
        login,
        loginAsDemoRole,
        logout,
        setActiveRoleOverride,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
