import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {useNavigate} from "react-router-dom";
import {API_BASE_URL} from "@/app-config";

interface AuthContextType {
  isLoggedIn: boolean;
  login: (accessToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialAuthState(): boolean {
  return !!localStorage.getItem("access_token");
}

export const AuthProvider = ({children}: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialAuthState);
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(getInitialAuthState());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (accessToken: string) => {
    localStorage.setItem("access_token", accessToken);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    localStorage.removeItem("access_token");
    try {
      await fetch(`${API_BASE_URL}auth/logout`, {
        method: "POST",
        credentials: "include", // Important: send cookies for refresh token
      });
    } catch (e) {
      // Optionally handle error
    }
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{isLoggedIn, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}