import { createContext, useContext, useEffect, useState } from "react";

import { getMe, login as loginRequest } from "../api/authApi";
import ROLES from "../constants/roles";

const AuthContext = createContext(null);

function readStoredSession() {
  const token = localStorage.getItem("authToken");
  const userJson = localStorage.getItem("authUser");

  return {
    token,
    user: userJson
      ? (() => {
          try {
            return JSON.parse(userJson);
          } catch {
            return null;
          }
        })()
      : null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrateSession = async () => {
      const stored = readStoredSession();

      if (!stored.token) {
        setLoading(false);
        return;
      }

      setToken(stored.token);

      try {
        const me = await getMe();

        setUser(me);

        localStorage.setItem("authUser", JSON.stringify(me));
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");

        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    hydrateSession();
  }, []);

  const login = async (credentials) => {
    const result = await loginRequest(credentials);

    setUser(result.user);
    setToken(result.token);

    localStorage.setItem("authToken", result.token);
    localStorage.setItem("authUser", JSON.stringify(result.user));

    return result.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === ROLES.ADMIN,
    isSuperAdmin: user?.isSuperAdmin === true,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
