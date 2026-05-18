import React, { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const savedTheme = localStorage.getItem("theme") || "light";
  const [theme, setTheme] = useState(savedTheme);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.className = theme === "dark" ? "theme-dark" : "theme-light";
  }, [theme]);

  function toggleTheme() {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
