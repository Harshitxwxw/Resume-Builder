import React, { createContext, useState, useEffect } from "react";
import { getMe } from "./services/auth.api";
import { migrateLegacyUserKeysIfNeeded } from "../../utils/userScope";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Initialize user from localStorage so page reloads have immediate user context
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("career_user");
      if (saved) {
        migrateLegacyUserKeysIfNeeded();
        return JSON.parse(saved);
      }
      return null;
    } catch {
      return null;
    }
  });

  // 2. If a cached user is found, don't block render with a loading screen.
  // If no user is cached, loading is true while verifying with the backend cookie.
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem("career_user");
    } catch {
      return true;
    }
  });

  // 3. Verify session with backend on initial app mount (runs ONCE for the whole application)
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const data = await getMe();
        if (isMounted) {
          if (data && data.user) {
            setUser(data.user);
            try {
              localStorage.setItem("career_user", JSON.stringify(data.user));
              migrateLegacyUserKeysIfNeeded();
            } catch (e) {}
          } else {
            // Session expired or token invalidated on backend
            setUser(null);
            try {
              localStorage.removeItem("career_user");
            } catch (e) {}
          }
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          try {
            localStorage.removeItem("career_user");
          } catch (e) {}
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
