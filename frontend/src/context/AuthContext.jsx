import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

function AuthProvider({ children }) {
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  const [token, setToken] = useState(savedToken);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        logout();
      }
    }
  }, []);

  useEffect(() => {
    async function checkSavedLogin() {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          const savedUserData = {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            token,
          };

          localStorage.setItem("user", JSON.stringify(savedUserData));
          setUser(savedUserData);
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }

      setAuthLoading(false);
    }

    checkSavedLogin();
  }, [token]);

  async function login(email, password) {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setToken(data.token);
      setUser(data);
    }

    return data;
  }

  async function register(name, email, password, role) {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setToken(data.token);
      setUser(data);
    }

    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, authLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
