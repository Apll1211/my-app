"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface SplashCursorContextType {
  isEnabled: boolean;
  toggleEnabled: () => void;
}

const SplashCursorContext = createContext<SplashCursorContextType | undefined>(
  undefined,
);

export function SplashCursorProvider({ children }: { children: ReactNode }) {
  // 从 localStorage 读取初始状态
  const getInitialState = useCallback(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("splashCursorEnabled");
      return saved === null ? true : saved === "true";
    } catch (error) {
      console.error("Failed to read from localStorage:", error);
      return true;
    }
  }, []);

  const [isEnabled, setIsEnabled] = useState<boolean>(getInitialState);

  // 监听 localStorage 变化（跨标签页同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "splashCursorEnabled" && e.newValue !== null) {
        setIsEnabled(e.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 保存状态到 localStorage
  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem("splashCursorEnabled", String(newValue));
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
      return newValue;
    });
  }, []);

  return (
    <SplashCursorContext.Provider value={{ isEnabled, toggleEnabled }}>
      {children}
    </SplashCursorContext.Provider>
  );
}

export function useSplashCursor() {
  const context = useContext(SplashCursorContext);
  if (context === undefined) {
    throw new Error("useSplashCursor must be used within a SplashCursorProvider");
  }
  return context;
}