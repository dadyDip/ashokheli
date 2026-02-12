"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user:", e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // NEW: Function to update user data
  const updateUser = (newUserData) => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      const updatedUser = { ...currentUser, ...newUserData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  // NEW: Simple refresh function
  const refreshUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (e) {
        console.error("Error refreshing user:", e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      updateUser, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);