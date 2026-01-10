import { type NextRequest, NextResponse } from "next/server";
import { db, generateId, getCurrentTime } from "@/lib/db";

// 指定使用 Node.js runtime（better-sqlite3 需要）
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, confirmPassword } = body;

    // 验证必填字段
    if (!phone || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "手机号和密码不能为空" },
        { status: 400 },
      );
    }

    // 验证手机号格式
    const phoneRegex = /^((\+|00)86)?1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "请输入有效的手机号" },
        { status: 400 },
      );
    }

    // 验证密码强度
    if (password.length < 8) {
      return NextResponse.json(
        { error: "密码至少需要8个字符" },
        { status: 400 },
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "密码必须包含至少一个大写字母" },
        { status: 400 },
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: "密码必须包含至少一个小写字母" },
        { status: 400 },
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "密码必须包含至少一个数字" },
        { status: 400 },
      );
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json(
        { error: "密码必须包含至少一个特殊字符" },
        { status: 400 },
      );
    }

    // 验证密码一致性
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "两次输入的密码不一致" },
        { status: 400 },
      );
    }

    // 检查手机号是否已存在
    const checkStmt = db.prepare("SELECT id FROM users WHERE username = ?");
    const existingUser = checkStmt.get(phone);
    if (existingUser) {
      return NextResponse.json({ error: "手机号已被注册" }, { status: 409 });
    }

    // 创建新用户
    const id = generateId();
    const now = getCurrentTime();

    const insertStmt = db.prepare(
      `INSERT INTO users (id, username, password, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    insertStmt.run(
      id,
      phone,
      password,
      "普通用户",
      "正常",
      now,
      now
    );

    // 返回用户信息（实际项目中应该生成 JWT token）
    const userWithoutPassword = {
      id,
      username: phone,
      nickname: null,
      bio: null,
      avatar: null,
      role: "普通用户",
      status: "正常",
      created_at: now,
    };

    return NextResponse.json({
      success: true,
      message: "注册成功",
      user: userWithoutPassword,
      token: `mock-token-${Date.now()}`,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
