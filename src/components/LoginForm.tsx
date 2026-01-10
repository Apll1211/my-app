"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, LogIn, User, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// 登录表单验证模式
const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名或手机号"),
  password: z.string().min(1, "请输入密码"),
});

// 注册表单验证模式
const registerSchema = z
  .object({
    phone: z
      .string()
      .min(1, "请输入手机号")
      .regex(/^((\+|00)86)?1[3-9]\d{9}$/, "请输入有效的手机号"),
    password: z
      .string()
      .min(8, "密码至少需要8个字符")
      .regex(/[A-Z]/, "密码必须包含至少一个大写字母")
      .regex(/[a-z]/, "密码必须包含至少一个小写字母")
      .regex(/[0-9]/, "密码必须包含至少一个数字")
      .regex(/[^A-Za-z0-9]/, "密码必须包含至少一个特殊字符"),
    confirmPassword: z.string().min(1, "请再次输入密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

// 表单值类型
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// 注册表单值类型（用于API调用）
interface RegisterFormData {
  phone: string;
  password: string;
  confirmPassword: string;
}

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister?: (
    phone: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
}

export default function LoginForm({
  isOpen,
  onClose,
  onLogin,
  onRegister,
}: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 根据模式选择验证模式
  const schema = isLogin ? loginSchema : registerSchema;

  // 初始化表单
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      username: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // 处理登录提交
  const handleLoginSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      await onLogin(values.username, values.password);
      onClose();
      form.reset();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理注册提交
  const handleRegisterSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      await onRegister(values.phone, values.password, values.confirmPassword);
      onClose();
      form.reset();
    } catch (error) {
      console.error("Register failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换登录/注册模式
  const toggleMode = () => {
    setIsLogin(!isLogin);
    form.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLogin ? "登录 GenVio" : "注册 GenVio"}</DialogTitle>
          <DialogDescription>
            {isLogin ? "登录后体验更多精彩内容" : "创建账号，开启精彩之旅"}
          </DialogDescription>
        </DialogHeader>

        <Form {...(form as any)}>
          <form
            onSubmit={
              form.handleSubmit(
                isLogin ? handleLoginSubmit : handleRegisterSubmit,
              ) as any
            }
            className="space-y-4 py-4"
          >
            {/* Username/Phone Input */}
            <FormField
              control={form.control}
              name={isLogin ? "username" : "phone"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isLogin ? "用户名/手机号" : "手机号"}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={
                          isLogin ? "请输入用户名或手机号" : "请输入手机号"
                        }
                        className="pl-10"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Input */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="请输入密码"
                        className="pl-10 pr-10"
                        disabled={isLoading}
                        {...field}
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Input (only for register) */}
            {!isLogin && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>确认密码</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="请再次输入密码"
                          className="pl-10 pr-10"
                          disabled={isLoading}
                          {...field}
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </motion.button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 border-2 border-current border-t-transparent rounded-full"
                />
              ) : isLogin ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>
                {isLoading
                  ? isLogin
                    ? "登录中..."
                    : "注册中..."
                  : isLogin
                    ? "登录"
                    : "注册"}
              </span>
            </motion.button>

            {/* Additional Links */}
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={toggleMode}
              >
                {isLogin ? "注册账号" : "已有账号？去登录"}
              </button>
              {isLogin && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                >
                  忘记密码？
                </button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
