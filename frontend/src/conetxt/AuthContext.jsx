import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const API_URL = "http://localhost:3000/api/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;


    async function checkSession() {
      try {
        let response = await fetch(`${API_URL}/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
        try {
          await refreshAccessToken();

          response = await fetch(`${API_URL}/me`, {
            method: "GET",
            credentials: "include",
          });
        } catch {
          if (active) setUser(null);
          return;
        }
      }
        if (!response.ok) {
          if (active) setUser(null);
          return;
        }

        const data = await response.json();

        if (active) {
          setUser(data.user ?? null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function refreshAccessToken() {
    const response = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Session expired. Please log in again.");
    }

    return true;
  }


  async function signup({ name, email, password }) {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create your account.");
      }

      const registeredUser = data.user ?? data.data;

      if (!registeredUser) {
        throw new Error("Registration succeeded, but user information was not returned.");
      }

      setUser(registeredUser);
      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  }

  async function login({ email, password }) {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      const loggedInUser = data.user ?? data.data;

      if (!loggedInUser) {
        throw new Error("Login succeeded, but user information was not returned.");
      }

      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    const response = await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Logout failed.");
    }

    setUser(null);
  }

  const value = {
    user,
    setUser,
    signup,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
};
