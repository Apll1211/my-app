"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Diamond,
  LogOut,
  Menu,
  MessageCircle,
  Monitor,
  Search,
  Type,
  Upload,
  Sparkles,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import LoginForm from "@/components/LoginForm";
import MobileMenuSheet from "@/components/layout/MobileMenuSheet";
import { useAuth } from "@/context/AuthContext";
import {
  buttonVariants,
  iconButtonVariants,
  transitions,
} from "@/lib/animations";

export default function Header() {
  const router = useRouter();
  const { user, login, logout, isAuthenticated } = useAuth();
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "登录失败");
      }

      const data = await response.json();
      console.log("Login successful:", data);

      // 更新认证状态
      login({
        id: data.user.id,
        username: data.user.username,
        nickname: data.user.nickname,
        bio: data.user.bio,
        avatar: data.user.avatar,
        role: data.user.role,
      });

      toast.success("登录成功！");
      setIsLoginFormOpen(false);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "登录失败");
      throw error;
    }
  };

  const handleRegister = async (
    username: string,
    password: string,
    confirmPassword: string,
  ) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, confirmPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "注册失败");
      }

      const data = await response.json();
      console.log("Register successful:", data);
      toast.success("注册成功！请登录");
    } catch (error) {
      console.error("Register error:", error);
      toast.error(error instanceof Error ? error.message : "注册失败");
      throw error;
    }
  };

  const handleUploadClick = useCallback(() => {
    if (!isAuthenticated) {
      setIsLoginFormOpen(true);
    } else {
      router.push("/user");
    }
  }, [isAuthenticated, router]);

  // 处理搜索输入变化
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 限制输入长度为 100 个字符
    if (value.length <= 100) {
      setSearchQuery(value);
    }
  }, []);

  // 处理搜索提交
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      // 跳转到搜索页面
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [searchQuery, router]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("已退出登录");
  }, [logout]);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-16 bg-background/70 backdrop-blur-xl border-b border-border lg:left-20 xl:left-44">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left: Mobile Menu Button & Search Bar */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 overflow-hidden">
          {/* Mobile Menu Button */}
          <motion.button
            type="button"
            variants={iconButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden shrink-0"
          >
            <motion.div
              animate={isMobileMenuOpen ? { rotate: 180 } : { rotate: 0 }}
              transition={transitions.smooth}
            >
              <Menu className="h-5 w-5" />
            </motion.div>
          </motion.button>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transitions.gentle}
            className="relative w-40 md:w-80 flex-1 min-w-0 max-w-md"
          >
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2"
              animate={searchQuery ? {
                color: "var(--primary)",
              } : {
                color: "var(--muted-foreground)",
              }}
              transition={transitions.smooth}
            >
              <motion.div
                animate={searchQuery ? {
                  rotate: [0, 360],
                } : {
                  rotate: 0,
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
              >
                <Search className="h-4 w-4 shrink-0" />
              </motion.div>
            </motion.div>
            <motion.input
              type="text"
              placeholder="搜索视频、作者、标签"
              value={searchQuery}
              onChange={handleSearchChange}
              maxLength={100}
              className="h-9 w-full rounded-full bg-muted px-10 py-2 text-sm outline-none border-2 border-transparent focus:ring-0 focus:border-primary placeholder:text-muted-foreground/70"
            />
          </motion.form>
            {/* Search suggestion indicator */}
            <AnimatePresence>
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={transitions.snappy}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Diamond - Desktop only */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center gap-1.5 rounded-full bg-linear-to-r from-yellow-400 to-orange-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-90 shrink-0"
          >
            <Diamond className="h-4 w-4" />
            <span>充值</span>
          </motion.button>

          {/* Icon Buttons - Hidden on mobile */}
          <motion.button
            type="button"
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="hidden md:flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0"
          >
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={transitions.smooth}
            >
              <Monitor className="h-4 w-4" />
            </motion.div>
            <span>客户端</span>
          </motion.button>

          <motion.button
            type="button"
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="hidden md:flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0"
          >
            <motion.div
              whileHover={{ rotate: -15 }}
              transition={transitions.smooth}
            >
              <Type className="h-4 w-4" />
            </motion.div>
            <span>壁纸</span>
          </motion.button>

          {/* Notification Icons - Only Bell on mobile */}
          <motion.button
            type="button"
            variants={iconButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Bell className="h-5 w-5" />
            {/* Notification Badge */}
            <motion.div
              className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={transitions.bouncy}
            />
          </motion.button>

          {/* Message Circle - Hidden on mobile */}
          <motion.button
            type="button"
            variants={iconButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="hidden relative h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground md:flex"
          >
            <motion.div
              whileHover={{ rotate: -15 }}
              transition={transitions.smooth}
            >
              <MessageCircle className="h-5 w-5" />
            </motion.div>
          </motion.button>

          {/* Upload Button - Hidden on mobile */}
          <motion.button
            type="button"
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={handleUploadClick}
            className="hidden md:flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0"
          >
            <motion.div
              whileHover={{ y: -2 }}
              transition={transitions.smooth}
            >
              <Upload className="h-4 w-4" />
            </motion.div>
            <span>投稿</span>
          </motion.button>

          {/* User Info / Login Button - Login button visible on mobile */}
          <AnimatePresence mode="wait">
            {isAuthenticated ? (
              <motion.div
                key="authenticated"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={transitions.gentle}
                className="hidden md:flex items-center gap-2"
              >
                <motion.button
                  type="button"
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={transitions.smooth}
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="头像"
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </motion.div>
                  <span>{user?.nickname || user?.username}</span>
                </motion.button>
                <motion.button
                  type="button"
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleLogout}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <motion.div
                    whileHover={{ rotate: -90 }}
                    transition={transitions.smooth}
                  >
                    <LogOut className="h-4 w-4" />
                  </motion.div>
                  <span>退出</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="login"
                type="button"
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={() => setIsLoginFormOpen(true)}
                className="rounded-full bg-linear-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 md:px-6 shrink-0"
              >
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ gap: 3 }}
                  transition={transitions.smooth}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>登录</span>
                </motion.div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <MobileMenuSheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Login Form */}
      <LoginForm
        isOpen={isLoginFormOpen}
        onClose={() => setIsLoginFormOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </header>
  );
}
