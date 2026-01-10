import { type NextRequest, NextResponse } from "next/server";
import { db, getCurrentTime } from "@/lib/db";

// 指定使用 Node.js runtime（better-sqlite3 需要）
export const runtime = "nodejs";

// 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, nickname, bio, avatar } = body;

    // 验证必填字段
    if (!userId) {
      return NextResponse.json(
        { error: "用户ID不能为空" },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const checkStmt = db.prepare("SELECT id FROM users WHERE id = ?");
    const existingUser = checkStmt.get(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 更新用户信息
    const updateStmt = db.prepare(`
      UPDATE users
      SET nickname = ?, bio = ?, avatar = ?, updated_at = ?
      WHERE id = ?
    `);

    const now = getCurrentTime();
    updateStmt.run(
      nickname || null,
      bio || null,
      avatar || null,
      now,
      userId
    );

    // 获取更新后的用户信息
    const getUserStmt = db.prepare(`
      SELECT id, username, nickname, bio, avatar, role, status, created_at
      FROM users WHERE id = ?
    `);
    const updatedUser = getUserStmt.get(userId) as any;

    return NextResponse.json({
      success: true,
      message: "更新成功",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}