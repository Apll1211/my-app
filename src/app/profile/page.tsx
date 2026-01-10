"use client";

import { Camera, CheckCircle2, Lock, Save, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoginForm from "@/components/LoginForm";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface UserProfile {
  id: string;
  username: string;
  nickname?: string | null;
  bio?: string | null;
  avatar?: string | null;
  role: string;
  status: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    nickname: "",
    bio: "",
    avatar: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // 使用访问控制 Hook
  useRequireAuth({
    onUnauthenticated: () => {
      setIsLoginFormOpen(true);
    },
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
    if (!isAuthenticated) {
      return;
    }

    // 加载用户详细信息
    const loadUserProfile = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data.success) {
          setProfile(data.user);
          setFormData({
            nickname: data.user.nickname || "",
            bio: data.user.bio || "",
            avatar: data.user.avatar || "",
          });
          if (data.user.avatar) {
            setAvatarPreview(data.user.avatar);
          }
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [isAuthenticated, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith("image/")) {
        alert("请选择图片文件");
        return;
      }

      // 验证文件大小（最大 2MB）
      if (file.size > 2 * 1024 * 1024) {
        alert("图片大小不能超过 2MB");
        return;
      }

      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          nickname: formData.nickname,
          bio: formData.bio,
          avatar: formData.avatar,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        // 更新 AuthContext 中的用户信息
        login({
          id: user.id,
          username: user.username,
          nickname: formData.nickname,
          bio: formData.bio,
          avatar: formData.avatar,
          role: user.role,
        });

        // 3秒后隐藏成功提示
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        alert(data.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("更新失败，请重试");
    } finally {
      setSaving(false);
    }
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
              <p className="text-muted-foreground mb-6">
                请先登录后再查看个人资料
              </p>
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
          {/* 成功提示 */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-medium text-green-600">保存成功！</p>
                <p className="text-sm text-green-600/80">您的个人资料已更新</p>
              </div>
            </div>
          )}

          {/* 个人资料表单 */}
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">编辑个人资料</h2>
                <p className="text-sm text-muted-foreground">
                  更新您的个人信息
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 头像上传 */}
              <div className="flex items-start gap-6">
                <div className="shrink-0">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="头像预览"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor="avatar" className="text-base font-medium">
                    头像
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    支持 JPG、PNG 格式，最大 2MB
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("avatar")?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      选择图片
                    </Button>
                  </div>
                </div>
              </div>

              {/* 昵称 */}
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-base font-medium">
                  昵称
                </Label>
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  placeholder="请输入昵称"
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground">最多 50 个字符</p>
              </div>

              {/* 简介 */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-base font-medium">
                  简介
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="介绍一下自己..."
                  rows={4}
                  maxLength={200}
                  className="resize-y overflow-y-auto"
                />
                <p className="text-sm text-muted-foreground">最多 200 个字符</p>
              </div>

              {/* 提交按钮 */}
              <div className="pt-4">
                <Button type="submit" disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "保存中..." : "保存更改"}
                </Button>
              </div>
            </form>
          </div>

          {/* 提示信息 */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">温馨提示</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>头像将显示在您的个人主页和评论中</li>
              <li>昵称和简介可以帮助其他用户更好地了解您</li>
              <li>内容务必遵守当地法律法规</li>
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
