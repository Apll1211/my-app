"use client";

import { CheckCircle2, Lock, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import VideoUploadForm from "@/components/VideoUploadForm";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import LoginForm from "@/components/LoginForm";

export default function UserPage() {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);

  // 使用 useCallback 包装回调函数，避免无限循环
  const handleUnauthenticated = useCallback(() => {
    setIsLoginFormOpen(true);
  }, []);

  // 使用访问控制 Hook
  useRequireAuth({
    onUnauthenticated: handleUnauthenticated,
  });

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
      
      // 更新认证状态
      login({
        id: data.user.id,
        username: data.user.username,
        nickname: data.user.nickname,
        bio: data.user.bio,
        avatar: data.user.avatar,
        role: data.user.role,
      });

      alert("登录成功！");
      setIsLoginFormOpen(false);
    } catch (error) {
      console.error("Login error:", error);
      alert(error instanceof Error ? error.message : "登录失败");
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
      alert("注册成功！请登录");
    } catch (error) {
      console.error("Register error:", error);
      alert(error instanceof Error ? error.message : "注册失败");
      throw error;
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSuccess = () => {
    setShowSuccess(true);
    setShowForm(false);
    // 3秒后自动隐藏成功提示并显示表单
    setTimeout(() => {
      setShowSuccess(false);
      setShowForm(true);
    }, 3000);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Header />
        <div className="fixed left-0 right-0 top-16 bottom-0 md:left-20 xl:left-44">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Header />
        <div className="fixed left-0 right-0 top-16 bottom-0 md:left-20 xl:left-44">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">需要登录</h3>
              <p className="text-muted-foreground mb-6">请先登录后再进行投稿</p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <div className="fixed left-0 right-0 top-16 bottom-0 md:left-20 xl:left-44 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              视频投稿
            </h1>
            <p className="text-muted-foreground">
              填写视频信息并提交，分享你的精彩内容
            </p>
          </div>

          {/* 成功提示 */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-medium text-green-600">投稿成功！</p>
                <p className="text-sm text-green-600/80">您的视频已成功提交</p>
              </div>
            </div>
          )}

          {/* 投稿表单 */}
          {showForm && (
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">填写视频信息</h2>
                  <p className="text-sm text-muted-foreground">
                    请完善以下信息以完成投稿
                  </p>
                </div>
              </div>

              <VideoUploadForm
                author={user?.username || ""}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* 取消后的提示 */}
          {!showForm && !showSuccess && (
            <div className="text-center py-12">
              <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">已取消投稿</h3>
              <p className="text-muted-foreground mb-6">
                您可以随时重新开始投稿
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-4 w-4" />
                重新投稿
              </button>
            </div>
          )}

          {/* 提示信息 */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">投稿须知</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>请确保视频内容符合平台规范</li>
              <li>标题为必填项</li>
              <li>标签可以帮助用户更好地发现您的视频</li>
              <li>支持 MP4、MOV、AVI、MKV 格式，最大 100MB</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <LoginForm
        isOpen={isLoginFormOpen}
        onClose={() => setIsLoginFormOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}
