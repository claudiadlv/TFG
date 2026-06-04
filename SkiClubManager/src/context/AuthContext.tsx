import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  accessToken: string | null;
  refreshToken: string | null;
  rol: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, rol: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [rol, setRol] = useState<string | null>(null);

  const isAuthenticated = !!accessToken && !!rol;

  const login = async (token: string, refresh: string, role: string) => {
    setAccessToken(token);
    setRefreshToken(refresh);
    setRol(role);
    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('refreshToken', refresh);
    await AsyncStorage.setItem('rol', role);
  };

  const logout = async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setRol(null);
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('rol');
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, rol, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
