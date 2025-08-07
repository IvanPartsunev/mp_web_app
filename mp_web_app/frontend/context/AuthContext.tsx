import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialAuthState(): boolean {
  // Check if access token exists in localStorage
  return !!localStorage.getItem("access_token");
}

export const AuthProvider = ({children}: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialAuthState);

  useEffect(() => {
    // Listen for storage changes (multi-tab logout/login)
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

  const logout = () => {
    localStorage.removeItem("access_token");
    // Optionally, clear all storage or cookies if needed
    // Remove refresh token cookie by setting it expired
    document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLoggedIn(false);
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