"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_ROUTES = ["/", "/recommend", "/search"];

interface UseRequireAuthOptions {
  /**
   * 是否在未登录时自动跳转到登录
   * @default false
   */
  redirectToLogin?: boolean;
  /**
   * 未登录时的回调函数
   */
  onUnauthenticated?: () => void;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}): {
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  const { redirectToLogin = false, onUnauthenticated } = options;

  useEffect(() => {
    // 模拟加载状态
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // 检查是否是公开路由
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route),
    );

    // 如果是公开路由，不需要检查登录状态
    if (isPublicRoute) {
      return;
    }

    // 如果用户未登录
    if (!isAuthenticated) {
      // 优先执行自定义回调
      if (onUnauthenticated) {
        onUnauthenticated();
      }
      // 否则跳转到登录页
      else if (redirectToLogin) {
        router.push("/");
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    pathname,
    redirectToLogin,
    onUnauthenticated,
    router,
  ]);

  return {
    isLoading,
    isAuthenticated,
  };
}
