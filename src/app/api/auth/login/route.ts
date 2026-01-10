import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 指定使用 Node.js runtime（better-sqlite3 需要）
export const runtime = "nodejs";

interface User {
  id: string;
  username: string;
  nickname?: string | null;
  bio?: string | null;
  avatar?: string | null;
  role: string;
  status: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 },
      );
    }

    // 查找用户
    const stmt = db.prepare(
      "SELECT id, username, nickname, bio, avatar, role, status, created_at FROM users WHERE username = ? AND password = ?"
    );
    const user = stmt.get(username, password) as User | undefined;

    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    // 检查用户状态
    if (user.status !== "正常") {
      return NextResponse.json({ error: "用户已被禁用" }, { status: 403 });
    }

    // 返回用户信息（实际项目中应该生成 JWT token）
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    };

    return NextResponse.json({
      success: true,
      message: "登录成功",
      user: userWithoutPassword,
      token: `mock-token-${Date.now()}`,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
