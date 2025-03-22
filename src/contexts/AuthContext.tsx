"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import jwt from "jsonwebtoken";

interface User {
  userId: string;
  role: "admin" | "user" | "super_admin" | "driver" | "approver";
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  gender?: string;
  phoneNumber?: string;
  birthDate?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // เช็ค token เมื่อ component mount
    const savedToken = localStorage.getItem("car_rent_token");
    if (savedToken) {
      try {
        const decoded = jwt.decode(savedToken) as User;
        if (decoded) {
          setUser(decoded);
          setToken(savedToken);
        }
      } catch (error) {
        console.log("Invalid token:", error);
        localStorage.removeItem("car_rent_token");
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("car_rent_token");
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
