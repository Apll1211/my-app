"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Unified Navigation Data Source - Same as Header
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

export default function CategoryNav() {
  const router = useRouter();
  const [allNavigation, setAllNavigation] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.success && data.data) {
          // Build unified navigation list with categories
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
          // Filter to show only relevant items for PC navigation: home, categories, archive, tags, about
          const pcNavigation = [
            STATIC_NAVIGATION[0], // home
            ...categoryNavigation,
            STATIC_NAVIGATION[2], // archive
            STATIC_NAVIGATION[3], // tags
            STATIC_NAVIGATION[4], // about
          ];
          setAllNavigation(pcNavigation);
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

  if (loading) {
    return (
      <div className="fixed left-0 right-0 top-16 z-30 bg-background/60 backdrop-blur-2xl border-b border-border/20">
        <div className="flex h-12 items-center px-4 overflow-x-auto scrollbar-hide md:px-6">
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 right-0 top-16 z-30 bg-background/60 backdrop-blur-2xl border-b border-border/20">
      <div className="flex h-12 items-center px-4 overflow-x-auto scrollbar-hide md:px-6">
        {allNavigation.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(item.path)}
            className="whitespace-nowrap px-4 py-2 text-sm font-medium text-foreground bg-transparent hover:bg-background/40 hover:text-accent-foreground transition-all duration-200 border-r border-border/10 last:border-r-0 cursor-pointer"
          >
            {item.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}