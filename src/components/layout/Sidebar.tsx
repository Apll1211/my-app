"use client";

import { motion } from "framer-motion";
import {
  Compass,
  Film,
  Heart,
  Home,
  PlayCircle,
  Radio,
  Settings,
  Sparkles,
  User,
  Users,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  navItemVariants,
  transitions,
} from "@/lib/animations";
import { useEffect, useState, useCallback, useMemo } from "react";
import ShinyText from "@/components/ShinyText";
import { useSplashCursor } from "@/context/SplashCursorContext";
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

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEnabled, toggleEnabled } = useSplashCursor();
  const [imageData, setImageData] = useState<ImageData | null>(null);

  // 加载 logo.svg 并解析为 ImageData
  useEffect(() => {
    async function loadLogoImage() {
      try {
        console.log('Sidebar: Loading logo.svg...');
        const response = await fetch('/logo.svg');
        const blob = await response.blob();
        const file = new File([blob], "logo.svg", { type: blob.type });
        console.log('Sidebar: Logo file created', { file, size: file.size, type: file.type });

        const parsedData = await parseLogoImage(file);
        console.log('Sidebar: Logo parsed successfully', {
          imageData: parsedData?.imageData,
          width: parsedData?.imageData?.width,
          height: parsedData?.imageData?.height
        });
        setImageData(parsedData?.imageData ?? null);
      } catch (err) {
        console.error("Sidebar: Error loading logo image:", err);
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

  const handleNavigation = useCallback((path: string) => {
    if (path) {
      router.push(path);
    }
  }, [router]);

  const isActive = useCallback((path: string | null) => {
    return path ? pathname === path : false;
  }, [pathname]);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-20 bg-background/80 backdrop-blur-xl border-r border-border lg:block xl:w-44 select-none">
      <div className="flex h-full flex-col py-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transitions.bouncy}
          className="mb-6 flex items-center justify-center px-3"
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="relative flex h-7 w-7 items-center justify-center overflow-hidden select-none"
              whileHover={{ scale: 1.1 }}
              transition={transitions.smooth}
            >
              {imageData && (
                <MetallicPaint
                  imageData={imageData}
                  params={{ edge: 1.5, patternBlur: 0.003, patternScale: 1.5, refraction: 0.02, speed: 0.4, liquid: 0.1 }}
                />
              )}
            </motion.div>
            <motion.div
              className="hidden xl:block"
              whileHover={{ letterSpacing: "0.05em" }}
              transition={transitions.smooth}
            >
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
                className="text-base font-bold select-none"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col gap-1 px-2">
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
                  variants={navItemVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  animate={isActive(item.path) ? "active" : "initial"}
                  onClick={() => handleNavigation(item.path || "")}
                  className={`group flex h-11 items-center justify-center gap-3 rounded-xl transition-all duration-200 cursor-pointer select-none ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <motion.div
                    whileHover={{ rotate: [-10, 10, -10, 0] }}
                    transition={{ type: "tween", duration: 0.3 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </motion.div>
                  <motion.span
                    className="hidden text-sm font-medium xl:block"
                    layout
                    transition={transitions.smooth}
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              );
            })
          )}
        </nav>

        {/* Splash Cursor Toggle */}
        <div className="mt-auto px-2 pb-2">
          <motion.button
            type="button"
            variants={navItemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={toggleEnabled}
            className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer select-none"
          >
            <motion.div
              whileHover={{ rotate: [-10, 10, -10, 0] }}
              transition={{ type: "tween", duration: 0.3 }}
              whileTap={{ scale: 0.9 }}
              className="hidden xl:block"
            >
              <Sparkles className="h-5 w-5 shrink-0" />
            </motion.div>
            <span className="text-sm font-medium hidden xl:block">
              滑动特效
            </span>
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
        </div>

        {/* Admin Panel Entry - Bottom Left */}
        <div className="px-2 pb-4">
          <motion.button
            type="button"
            variants={navItemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => router.push("/admin")}
            className="group flex h-11 w-full items-center justify-center gap-3 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer select-none"
          >
            <motion.div
              whileHover={{ rotate: [-10, 10, -10, 0] }}
              transition={{ type: "tween", duration: 0.3 }}
              whileTap={{ scale: 0.9 }}
            >
              <Settings className="h-5 w-5 shrink-0" />
            </motion.div>
            <span className="hidden text-sm font-medium xl:block">
              后台管理
            </span>
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
