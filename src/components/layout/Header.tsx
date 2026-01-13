"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Home,
  Info,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  Tag,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import MetallicPaint, { parseLogoImage } from "@/components/MetallicPaint";
import ShinyText from "@/components/ShinyText";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSplashCursor } from "@/context/SplashCursorContext";
import { useTheme } from "@/context/ThemeContext";
import { buttonVariants, transitions } from "@/lib/animations";

// Unified Navigation Data Source
interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  path: string;
  type: "static" | "category";
  slug?: string;
}

const STATIC_NAVIGATION: NavigationItem[] = [
  { id: "home", name: "首页", icon: "Home", path: "/", type: "static" },
  { id: "search", name: "搜索", icon: "Search", path: "/search", type: "static" },
  { id: "archive", name: "归档", icon: "Archive", path: "/archive", type: "static" },
  { id: "tags", name: "标签", icon: "Tag", path: "/tags", type: "static" },
  { id: "about", name: "关于", icon: "Info", path: "/about", type: "static" },
];

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Home,
  Search,
  Archive,
  Tag,
  Info,
};

// Mobile Menu Button Component - Uses unified navigation data
function MobileMenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="md:hidden flex items-center gap-2 px-2 py-1.5 rounded-lg bg-background/60 backdrop-blur-xl border border-border/20 text-muted-foreground hover:bg-background/70 hover:text-accent-foreground active:scale-95 transition-transform active:bg-background/60"
          aria-label="打开菜单"
        >
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-sm p-0 sm:w-80 bg-background/95 backdrop-blur-xl"
      >
        <SheetTitle className="sr-only">导航菜单</SheetTitle>
        {/* Use existing MobileMenuSheet component */}
        <MobileMenuSheetContent />
      </SheetContent>
    </Sheet>
  );
}

// MobileMenuSheetContent - Blog Navigation Menu
function MobileMenuSheetContent() {
  const router = useRouter();
  const { isEnabled, toggleEnabled } = useSplashCursor();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [allNavigation, setAllNavigation] = useState<NavigationItem[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.success && data.data) {
          setCategories(data.data);
          // Build unified navigation list
          const categoryNavigation: NavigationItem[] = data.data.map(
            (category: { id: string; name: string; slug: string }) => ({
              id: `category-${category.id}`,
              name: category.name,
              icon: "Tag",
              path: `/category/${category.slug}`,
              type: "category" as const,
              slug: category.slug,
            })
          );
          setAllNavigation([...STATIC_NAVIGATION, ...categoryNavigation]);
        }
      } catch (error) {
        // Silent fail - fallback to static navigation
        setAllNavigation(STATIC_NAVIGATION);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  // Get navigation items with flat glassmorphism style
  const getNavItemStyle = (item: NavigationItem) => {
    return "flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground bg-transparent backdrop-blur-xl border-b border-border/20 hover:bg-background/40 hover:text-accent-foreground transition-all duration-200";
  };

  return (
    <>
      {/* Mobile Search Bar - Flat Style */}
      <div className="border-b border-border/20 p-4 bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="搜索文章"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxLength={100}
              className="h-9 w-full px-9 pr-3 text-sm outline-none bg-transparent border-b border-border/20 focus:border-primary/50 placeholder:text-muted-foreground/70 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-2 h-9 text-sm font-medium text-foreground bg-transparent hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
            aria-label="搜索"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Blog Navigation - Unified Data Source - Flat Style */}
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="py-2">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-4">
            导航
          </div>
          <div className="flex flex-col">
            {allNavigation.map((item) => {
              const IconComponent = ICON_MAP[item.icon];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(item.path)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground bg-background/95 backdrop-blur-xl hover:bg-background/40 hover:text-primary transition-all duration-200 border-b border-border/10 cursor-pointer"
                >
                  {IconComponent && (
                    <IconComponent className="h-4 w-4 text-primary hover:text-primary" />
                  )}
                  <span className="flex-1 text-left">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions - Flat Style */}
        <div className="border-t border-border/20 py-2 bg-background/95 backdrop-blur-xl">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-4">
            页面设置
          </div>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={toggleEnabled}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground bg-background/95 backdrop-blur-xl hover:bg-background/40 hover:text-primary transition-all duration-200 border-b border-border/10 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>滑动特效</span>
              </div>
              <div
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  isEnabled ? "bg-primary" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isEnabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Header() {
  const router = useRouter();
  const { isEnabled, toggleEnabled } = useSplashCursor();
  const { theme, isDark, mode, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [imageData, setImageData] = useState<ImageData | null>(null);

  // 加载 logo.svg 并解析为 ImageData
  useEffect(() => {
    async function loadLogoImage() {
      try {
        const response = await fetch("/logo.svg");
        const blob = await response.blob();
        const file = new File([blob], "logo.svg", { type: blob.type });
        const parsedData = await parseLogoImage(file);
        setImageData(parsedData?.imageData ?? null);
      } catch (err) {
        // Silent fail
      }
    }

    loadLogoImage();
  }, []);

  // 处理搜索输入变化
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // 限制输入长度为 100 个字符
      if (value.length <= 100) {
        setSearchQuery(value);
      }
    },
    [],
  );

  // 处理搜索提交
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery) {
        // 跳转到搜索页面
        router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      }
    },
    [searchQuery, router],
  );

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-16 bg-background/60 backdrop-blur-2xl border-b border-border/20">
      <div className="flex h-full items-center justify-between px-3 md:px-6">
        {/* Left: Mobile Menu Trigger */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 overflow-hidden">
          {/* Mobile Menu Trigger */}
          <MobileMenuButton />

          {/* Desktop Logo - Hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={transitions.bouncy}
            className="hidden md:flex items-center gap-2 mr-2"
          >
            <motion.div
              className="relative flex h-7 w-7 items-center justify-center overflow-hidden select-none"
              whileHover={{ scale: 1.1 }}
              transition={transitions.smooth}
            >
              {imageData && (
                <MetallicPaint
                  imageData={imageData}
                  params={{
                    edge: 1.5,
                    patternBlur: 0.003,
                    patternScale: 1.5,
                    refraction: 0.02,
                    speed: 0.4,
                    liquid: 0.1,
                  }}
                />
              )}
            </motion.div>
            <motion.div
              whileHover={{ letterSpacing: "0.05em" }}
              transition={transitions.smooth}
            >
              <ShinyText
                text="Apllgen"
                speed={2}
                delay={0}
                spread={120}
                direction="left"
                yoyo={false}
                pauseOnHover={false}
                className="text-base font-bold select-none"
              />
            </motion.div>
          </motion.div>

          {/* Desktop Search Bar */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transitions.gentle}
            className="hidden md:flex relative w-80 flex-1 min-w-0 max-w-md"
            aria-label="搜索表单"
          >
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2"
              animate={
                searchQuery
                  ? {
                      color: "#3b82f6",
                    }
                  : {
                      color: "#6b7280",
                    }
              }
              transition={transitions.smooth}
            >
              <motion.div
                animate={
                  searchQuery
                    ? {
                        rotate: [0, 360],
                      }
                    : {
                        rotate: 0,
                      }
                }
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
              placeholder="搜索文章、内容、标签"
              value={searchQuery}
              onChange={handleSearchChange}
              maxLength={100}
              className="h-9 w-full rounded-full bg-background/60 backdrop-blur-xl px-10 py-2 text-sm outline-none border-2 border-border/30 focus:ring-0 focus:border-primary/50 placeholder:text-muted-foreground/70"
            />
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
          </motion.form>

          {/* Mobile Center Logo/ApllGeo - Only on mobile */}
          <div className="md:hidden flex items-center justify-center gap-2 flex-1 min-w-0">
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden select-none shrink-0">
              {imageData && (
                <MetallicPaint
                  imageData={imageData}
                  params={{
                    edge: 1.5,
                    patternBlur: 0.003,
                    patternScale: 1.5,
                    refraction: 0.02,
                    speed: 0.4,
                    liquid: 0.1,
                  }}
                />
              )}
            </div>
            <motion.div
              whileHover={{ letterSpacing: "0.05em" }}
              transition={transitions.smooth}
              className="whitespace-nowrap"
            >
              <ShinyText
                text="Apllgen"
                speed={2}
                delay={0}
                spread={120}
                direction="left"
                yoyo={false}
                pauseOnHover={false}
                className="text-lg font-bold select-none"
              />
            </motion.div>
          </div>
        </div>

        {/* Right: Theme Toggle & Splash Cursor */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Theme Toggle - Compact on mobile with better spacing */}
          <motion.button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-background/60 backdrop-blur-xl border border-border/20 text-muted-foreground hover:bg-background/70 hover:text-primary active:scale-95 active:bg-background/60 transition-transform ml-1 md:ml-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={transitions.smooth}
            aria-label="切换主题"
            title={
              mode === "auto"
                ? "当前为自动模式，点击切换为手动控制"
                : "手动控制主题，点击切换回自动模式"
            }
          >
            <motion.div
              className="relative w-4 h-4"
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={transitions.smooth}
            >
              {isDark ? (
                <Moon className="absolute inset-0 w-4 h-4" />
              ) : (
                <Sun className="absolute inset-0 w-4 h-4" />
              )}
            </motion.div>
          </motion.button>

          {/* Splash Cursor Toggle - Hidden on mobile */}
          <motion.button
            type="button"
            onClick={toggleEnabled}
            className="hidden sm:flex items-center gap-2 rounded-lg px-2 md:px-3 py-2 text-sm font-medium text-muted-foreground bg-background/60 backdrop-blur-xl border border-border/20 hover:bg-background/70 hover:text-primary active:scale-95 active:bg-background/60 transition-transform"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={transitions.smooth}
            aria-label="切换滑动特效"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:block">滑动特效</span>
            <motion.div
              className="relative h-5 w-9 rounded-full transition-colors"
              animate={{
                backgroundColor: isEnabled ? "#3b82f6" : "#e5e7eb",
              }}
              transition={transitions.smooth}
            >
              <motion.div
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                animate={{
                  x: isEnabled ? 16 : 0,
                }}
                transition={transitions.smooth}
              />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
