import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {useNavigate} from "react-router-dom";
import {API_BASE_URL} from "@/app-config";
import {getAccessToken, setAccessToken} from "@/context/tokenStore";
import {isJwtExpired} from "@/context/jwt";
import axios from "axios";

interface AuthContextType {
  isLoggedIn: boolean;
  login: (accessToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialAuthState(): boolean {
  const token = getAccessToken();
  // If there's any token (even expired), assume logged in initially
  // checkAuth will handle refresh if needed
  return !!token;
}

let isRefreshingInContext = false;

export const AuthProvider = ({children}: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialAuthState);
  const navigate = useNavigate();

  // Function to check and update auth state
  const checkAuth = async () => {
    const token = getAccessToken();
    
    // No token at all - definitely logged out
    if (!token) {
      if (isLoggedIn) {
        setIsLoggedIn(false);
      }
      return;
    }
    
    // Token exists and is valid - logged in
    if (!isJwtExpired(token)) {
      if (!isLoggedIn) {
        setIsLoggedIn(true);
      }
      return;
    }
    
    // Token is expired - try to refresh it silently
    // Keep isLoggedIn true during refresh to avoid UI flicker
    if (!isRefreshingInContext) {
      isRefreshingInContext = true;
      try {
        const res = await axios.post(
          `${API_BASE_URL}auth/refresh`,
          {},
          {withCredentials: true}
        );
        const newToken = res.data?.access_token;
        if (newToken) {
          setAccessToken(newToken);
          // Keep logged in state
          if (!isLoggedIn) {
            setIsLoggedIn(true);
          }
        } else {
          // Only log out if refresh explicitly failed
          setAccessToken(null);
          setIsLoggedIn(false);
        }
      } catch {
        // Refresh failed - clear token and log out
        setAccessToken(null);
        setIsLoggedIn(false);
      } finally {
        isRefreshingInContext = false;
      }
    }
  };

  useEffect(() => {
    // Check auth state periodically (every 30 seconds is enough)
    const interval = setInterval(checkAuth, 30000);
    
    // Keep isLoggedIn in sync across tabs/windows
    const handleStorage = () => {
      checkAuth();
    };
    
    // Listen for visibility change to check auth when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    
    // Listen for token cleared event from apiClient
    const handleTokenCleared = () => {
      setIsLoggedIn(false);
    };
    
    window.addEventListener("storage", handleStorage);
    window.addEventListener("token-cleared", handleTokenCleared);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("token-cleared", handleTokenCleared);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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