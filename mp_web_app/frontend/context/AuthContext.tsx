import {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {useNavigate} from "react-router-dom";
import {API_BASE_URL} from "@/app-config";
import {getAccessToken, setAccessToken} from "@/context/tokenStore";
import apiClient from "@/context/apiClient";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
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
        setUser(null);
        return;
      }

      try {
        // Fetch current user info
        const response = await apiClient.get("users/me");
        setUser(response.data);
        setIsLoggedIn(true);
      } catch (error: any) {
        // If it's a 401 after refresh attempt, token is invalid
        if (error.response?.status === 401) {
          setAccessToken(null);
          setIsLoggedIn(false);
          setUser(null);
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
      setUser(null);
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
    setUser(null);

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

  return <AuthContext.Provider value={{isLoggedIn, user, login, logout, checkAuth}}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
