"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("movie-theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : preferredTheme);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("movie-theme", theme);
  }, [theme, themeReady]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button className="theme-toggle" type="button" aria-label={`Switch to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`} aria-pressed={theme === "dark"} onClick={() => setTheme(nextTheme)}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M8.5 14.5A7 7 0 1 1 15.5 14.5c-.9.7-1.5 1.8-1.5 3.5h-4c0-1.7-.6-2.8-1.5-3.5Z" />
      </svg>
    </button>
  );
}
