"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { transitions } from "@/lib/animations";

export default function ThemeToggle() {
  const { theme, isDark, systemTheme } = useTheme();

  return (
    <motion.div
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground"
      transition={transitions.smooth}
      aria-label="当前系统主题"
      title="跟随系统主题"
    >
      <motion.div
        className="relative w-5 h-5"
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={transitions.smooth}
      >
        {isDark ? (
          <Moon className="absolute inset-0 w-5 h-5" />
        ) : (
          <Sun className="absolute inset-0 w-5 h-5" />
        )}
      </motion.div>
      <span className="hidden sm:inline text-sm font-medium">
        {isDark ? "深色模式" : "浅色模式"}
      </span>
      <motion.span
        className="text-xs opacity-60 ml-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transitions.smooth}
      >
        (自动)
      </motion.span>
    </motion.div>
  );
}