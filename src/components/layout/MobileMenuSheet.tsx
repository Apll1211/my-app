"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Compass,
  Diamond,
  Film,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Monitor,
  Palette,
  PlayCircle,
  Radio,
  Settings,
  Sparkles,
  Type,
  Upload,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useSplashCursor } from "@/context/SplashCursorContext";
import ShinyText from "@/components/ShinyText";
import { transitions } from "@/lib/animations";
import MetallicPaint, { parseLogoImage } from "@/components/MetallicPaint";

// 图标映射
const iconMap: Record<string, LucideIcon> = {
  Home,
  Compass,
  Sparkles,
  Heart,
  Users,
  User,
  Radio,
  Film,
  PlayCircle,
  Palette,
};

interface SidebarItem {
  id: string;
  label: string | null;
  icon_name: string | null;
  path: string | null;
  sort_order: number;
  item_type: "button" | "divider";
  active: number;
}

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenuSheet({
  isOpen,
  onClose,
}: MobileMenuSheetProps) {
  const router = useRouter();
  const { user, logout, isAuthenticated, login } = useAuth();
  const { isEnabled, toggleEnabled } = useSplashCursor();
  const [currentUser, setCurrentUser] = useState(user);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageData, setImageData] = useState<ImageData | null>(null);

  // 加载 logo.svg 并解析为 ImageData
  useEffect(() => {
    async function loadLogoImage() {
      try {
        console.log('MobileMenuSheet: Loading logo.svg...');
        const response = await fetch('/logo.svg');
        const blob = await response.blob();
        const file = new File([blob], "logo.svg", { type: blob.type });
        console.log('MobileMenuSheet: Logo file created', { file, size: file.size, type: file.type });

        const parsedData = await parseLogoImage(file);
        console.log('MobileMenuSheet: Logo parsed successfully', {
          imageData: parsedData?.imageData,
          width: parsedData?.imageData?.width,
          height: parsedData?.imageData?.height
        });
        setImageData(parsedData?.imageData ?? null);
      } catch (err) {
        console.error("MobileMenuSheet: Error loading logo image:", err);
      }
    }

    loadLogoImage();
  }, []);

  // 从数据库获取侧边栏配置
  useEffect(() => {
    const fetchSidebarItems = async () => {
      try {
        const response = await fetch("/api/sidebar");
        const data = await response.json();
        if (data.items) {
          setSidebarItems(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar items:", error);
      } finally {
        setLoading(false);
      }
    };

    // 初始加载
    fetchSidebarItems();

    // 监听自定义事件，当侧边栏配置更新时刷新
    const handleSidebarUpdate = () => {
      fetchSidebarItems();
    };

    window.addEventListener('sidebar-update', handleSidebarUpdate);
    
    return () => {
      window.removeEventListener('sidebar-update', handleSidebarUpdate);
    };
  }, []);

  // 从数据库加载最新的用户信息
  const loadUserProfile = useCallback(async () => {
    if (!isAuthenticated || !user?.id || hasLoaded) {
      setCurrentUser(user);
      return;
    }

    try {
      const response = await fetch(`/api/user/${user.id}`);
      const data = await response.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        setHasLoaded(true);
        // 更新 AuthContext 中的用户信息
        login({
          id: data.user.id,
          username: data.user.username,
          nickname: data.user.nickname,
          bio: data.user.bio,
          avatar: data.user.avatar,
          role: data.user.role,
        });
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
      // 如果加载失败，使用 AuthContext 中的用户信息
      setCurrentUser(user);
      setHasLoaded(true);
    }
  }, [isAuthenticated, user, login, hasLoaded]);

  // 当菜单打开时重新加载用户信息
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadUserProfile();
    }
  }, [isOpen, hasLoaded, loadUserProfile]);

  // 当菜单关闭时重置加载标志
  useEffect(() => {
    if (!isOpen) {
      setHasLoaded(false);
    }
  }, [isOpen]);

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    alert("已退出登录");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center gap-2 select-none">
            <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden select-none">
              {imageData && (
                <MetallicPaint
                  imageData={imageData}
                  params={{ edge: 1.5, patternBlur: 0.003, patternScale: 1.5, refraction: 0.02, speed: 0.4, liquid: 0.1 }}
                />
              )}
            </div>
            <ShinyText
              text="GenVio"
              speed={3}
              delay={0}
              color="#9ca3af"
              shineColor="#ffffff"
              spread={120}
              direction="left"
              yoyo={false}
              pauseOnHover={false}
              className="text-lg font-bold select-none"
            />
          </SheetTitle>
        </SheetHeader>

        <div className="flex h-full flex-col overflow-y-auto">
          {/* User Info */}
          {isAuthenticated && currentUser && (
            <button
              type="button"
              onClick={() => handleNavigation("/profile")}
              className="w-full border-b border-border p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="头像"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{currentUser.nickname || currentUser.username}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.username}</p>
                </div>
              </div>
            </button>
          )}

          {/* Navigation Items */}
          <nav className="flex flex-1 flex-col gap-1 p-2">
            {loading ? (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                加载中...
              </div>
            ) : (
              sidebarItems.map((item) => {
                if (item.item_type === "divider") {
                  return (
                    <div key={item.id} className="my-2 h-px w-full bg-border" />
                  );
                }

                const Icon = item.icon_name ? iconMap[item.icon_name] : null;
                if (!Icon) return null;

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigation(item.path || "")}
                    className="flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })
            )}
          </nav>

          {/* Quick Actions */}
          <div className="border-t border-border p-4">
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center gap-1 rounded-lg p-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Bell className="h-5 w-5" />
                <span className="text-xs">通知</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center gap-1 rounded-lg p-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">消息</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center gap-1 rounded-lg p-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Monitor className="h-5 w-5" />
                <span className="text-xs">客户端</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center gap-1 rounded-lg p-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Type className="h-5 w-5" />
                <span className="text-xs">壁纸</span>
              </motion.button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-border p-4">
            <div className="flex flex-col gap-2">
              {/* Splash Cursor Toggle */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleEnabled}
                className="flex items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>滑动特效</span>
                </div>
                <motion.div
                  className="relative h-5 w-9 rounded-full bg-muted transition-colors"
                  animate={{
                    backgroundColor: isEnabled ? "var(--primary)" : "var(--muted)",
                  }}
                  transition={transitions.smooth}
                >
                  <motion.div
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                    animate={{
                      x: isEnabled ? 16 : 2,
                    }}
                    transition={transitions.smooth}
                  />
                </motion.div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-lg bg-linear-to-r from-yellow-400 to-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Diamond className="h-4 w-4" />
                </motion.div>
                <span>充值</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigation("/user")}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Upload className="h-4 w-4" />
                <span>投稿</span>
              </motion.button>

              {isAuthenticated && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出登录</span>
                </motion.button>
              )}

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigation("/admin")}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-4 w-4" />
                <span>后台管理</span>
              </motion.button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
