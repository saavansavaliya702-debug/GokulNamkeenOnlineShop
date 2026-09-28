// src/pages/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setUser(raw && raw !== "undefined" ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔑 Call this from Login after successful login/OTP
  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData); // triggers re-render everywhere useAuth() is used
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);