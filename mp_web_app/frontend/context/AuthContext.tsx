import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {useNavigate} from "react-router-dom";
import {API_BASE_URL} from "@/app-config";
import {getAccessToken, setAccessToken} from "@/context/tokenStore";

interface AuthContextType {
  isLoggedIn: boolean;
  login: (accessToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialAuthState(): boolean {
  return !!getAccessToken();
}

export const AuthProvider = ({children}: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialAuthState);
  const navigate = useNavigate();

  useEffect(() => {
    // Keep isLoggedIn in sync across tabs/windows
    const handleStorage = () => {
      setIsLoggedIn(getInitialAuthState());
    };
    
    // Listen for auth failures from apiClient
    const handleAuthFailed = () => {
      setIsLoggedIn(false);
      setAccessToken(null);
      navigate("/");
    };
    
    window.addEventListener("storage", handleStorage);
    window.addEventListener("auth-failed", handleAuthFailed);
    
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auth-failed", handleAuthFailed);
    };
  }, [navigate]);

  const login = (accessToken: string) => {
    setAccessToken(accessToken);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    // Clear access token first
    setAccessToken(null);
    setIsLoggedIn(false);

    try {
      await fetch(`${API_BASE_URL}auth/logout`, {
        method: "POST",
        credentials: "include", // include cookies to remove refresh token server-side
      });
    } catch {
      // ignore network errors during logout
    }

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