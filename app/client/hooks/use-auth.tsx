import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => void;
  signup: (username: string, password: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load user from storage:", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string) => {
    if (!username || !password) throw new Error("Username and password required");
    
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    const storedUser = users[username];
    
    if (!storedUser || storedUser.password !== password) {
      throw new Error("Invalid credentials");
    }

    const userData = { id: storedUser.id, username };
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const signup = (username: string, password: string) => {
    if (!username || !password) throw new Error("Username and password required");
    if (username.length < 3) throw new Error("Username must be at least 3 characters");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[username]) {
      throw new Error("Username already exists");
    }

    const id = Math.random().toString(36).slice(2);
    users[username] = { id, password };
    localStorage.setItem("users", JSON.stringify(users));

    const userData = { id, username };
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
