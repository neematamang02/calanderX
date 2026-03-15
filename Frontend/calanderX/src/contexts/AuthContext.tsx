/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "../types/api";
import { authApi } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredAuth = (): { user: User | null; token: string | null } => {
  const savedToken = localStorage.getItem("authToken");
  const savedUser = localStorage.getItem("user");

  if (!savedToken || !savedUser) {
    return { user: null, token: null };
  }

  try {
    return {
      token: savedToken,
      user: JSON.parse(savedUser) as User,
    };
  } catch (error) {
    console.error("Error parsing saved user data:", error);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    return { user: null, token: null };
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [initialAuth] = useState(getStoredAuth);
  const [user, setUser] = useState<User | null>(initialAuth.user);
  const [token, setToken] = useState<string | null>(initialAuth.token);
  const [isLoading] = useState(false);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    // Placeholder for future async auth initialization (e.g., token refresh).
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });

    if (response.success && response.data) {
      setUser(response.data.user);
      setToken(response.data.token);

      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    } else {
      throw new Error(response.error || "Login failed");
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await authApi.register({ email, password, name });

    if (response.success && response.data) {
      setUser(response.data.user);
      setToken(response.data.token);

      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    } else {
      throw new Error(response.error || "Registration failed");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
