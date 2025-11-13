import {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {useNavigate} from "react-router-dom";
import {API_BASE_URL} from "@/app-config";
import {getAccessToken, setAccessToken} from "@/context/tokenStore";
import apiClient from "@/context/apiClient";

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

export const AuthProvider = ({children}: {children: ReactNode}) => {
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

  // Validate token on mount by making a lightweight API call
  useEffect(() => {
    const validateToken = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        // Make a lightweight request to validate token
        // If token is expired, apiClient interceptor will automatically refresh it
        // Using news/get as a lightweight endpoint (returns quickly)
        await apiClient.get("news/list");
        // If we get here, token is valid or was refreshed successfully
        setIsLoggedIn(true);
      } catch (error: any) {
        // If it's a 401 after refresh attempt, token is invalid
        if (error.response?.status === 401) {
          setAccessToken(null);
          setIsLoggedIn(false);
        }
        // For other errors (network, etc), keep logged in state
      }
    };

    validateToken();
  }, []); // Only run once on mount

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

  return <AuthContext.Provider value={{isLoggedIn, login, logout, checkAuth}}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
