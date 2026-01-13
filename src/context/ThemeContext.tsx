"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeMode = "auto" | "manual";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  systemTheme: Theme | null;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [systemTheme, setSystemTheme] = useState<Theme | null>(null);
  const [mode, setMode] = useState<ThemeMode>("auto");

  // 检测系统主题并监听变化（仅在自动模式下）
  useEffect(() => {
    if (mode !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const updateTheme = () => {
      const isDark = mediaQuery.matches;
      const newTheme: Theme = isDark ? "dark" : "light";
      setTheme(newTheme);
      setSystemTheme(newTheme);
    };

    // 初始检测
    updateTheme();

    // 监听系统主题变化
    mediaQuery.addEventListener("change", updateTheme);

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [mode]);

  // 根据主题设置更新 DOM
  useEffect(() => {
    const root = window.document.documentElement;
    
    // 移除所有主题类
    root.classList.remove("light", "dark");
    
    // 添加对应主题类
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  }, [theme]);

  // 切换主题（手动模式下）
  const toggleTheme = () => {
    if (mode === "manual") {
      setTheme((prev) => (prev === "light" ? "dark" : "light"));
    } else {
      // 在自动模式下，切换到手动模式并翻转当前主题
      setMode("manual");
      setTheme((prev) => (prev === "light" ? "dark" : "light"));
    }
  };

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark,
      systemTheme,
      mode,
      toggleTheme,
      setMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}