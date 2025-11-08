import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {useNavigate} from "react-router-dom";
import {API_BASE_URL} from "@/app-config";
import {getAccessToken, setAccessToken} from "@/context/tokenStore";

interface AuthContextType {
  isLoggedIn: boolean;
  login: (accessToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialAuthState(): boolean {
  const token = getAccessToken();
  return !!token;
}

export const AuthProvider = ({children}: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialAuthState);
  const navigate = useNavigate();

  // Function to check and update auth state (only checks token existence, no API calls)
  const checkAuth = () => {
    const token = getAccessToken();
    const newState = !!token;
    if (newState !== isLoggedIn) {
      setIsLoggedIn(newState);
    }
  };

  useEffect(() => {
    // Keep isLoggedIn in sync across tabs/windows
    const handleStorage = () => {
      checkAuth();
    };
    
    // Listen for token cleared event from apiClient (when refresh fails)
    const handleTokenCleared = () => {
      setIsLoggedIn(false);
    };
    
    window.addEventListener("storage", handleStorage);
    window.addEventListener("token-cleared", handleTokenCleared);
    
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("token-cleared", handleTokenCleared);
    };
  }, [isLoggedIn]);

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
    <AuthContext.Provider value={{isLoggedIn, login, logout, checkAuth}}>
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