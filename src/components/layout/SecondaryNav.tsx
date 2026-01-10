"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

interface Category {
  id: string;
  label: string;
  sort_order: number;
  active: number;
}

export default function SecondaryNav() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    // TODO: 可以在这里添加筛选逻辑
    console.log("Selected category:", categoryId);
  }, []);
  return (
    <div className="fixed left-0 right-0 top-16 z-30 bg-background/70 backdrop-blur-xl border-b border-border lg:left-20 xl:left-44">
      <div className="flex h-12 items-center gap-1 px-4 overflow-x-auto scrollbar-hide md:px-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            加载中...
          </div>
        ) : (
          categories.map((category, index) => (
            <motion.button
              key={category.id}
              type="button"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {category.label}
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
