import { type NextRequest, NextResponse } from "next/server";
import { recordOperation } from "@/lib/backup";
import { db, generateId, getCurrentTime } from "@/lib/db";

// 指定使用 Node.js runtime（better-sqlite3 需要）
export const runtime = "nodejs";

// GET - 获取用户列表（懒加载）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const lastId = searchParams.get("lastId"); // 游标：最后一条记录的ID

    let users: any[];

    if (lastId) {
      // 基于游标的分页：获取比 lastId 更早的记录
      const stmt = db.prepare(
        "SELECT id, username FROM users WHERE created_at < (SELECT created_at FROM users WHERE id = ?) ORDER BY created_at DESC LIMIT ?",
      );
      users = stmt.all(lastId, limit).map((user: any) => ({
        ...user,
        key: user.id,
      }));
    } else {
      // 首次加载
      const stmt = db.prepare(
        "SELECT id, username FROM users ORDER BY created_at DESC LIMIT ?",
      );
      users = stmt.all(limit).map((user: any) => ({
        ...user,
        key: user.id,
      }));
    }

    // 判断是否还有更多数据
    const hasMore = users.length === limit;

    return NextResponse.json({
      users,
      hasMore,
      lastId: users.length > 0 ? users[users.length - 1].id : null,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "获取用户列表失败", details: String(error) },
      { status: 500 },
    );
  }
}

// POST - 创建新用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "用户名和密码不能为空" },
        { status: 400 },
      );
    }

    const id = generateId();
    const now = getCurrentTime();

    const stmt = db.prepare(
      `INSERT INTO users (id, username, password, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    stmt.run(id, username, password, "普通用户", "正常", now, now);

    const newUser = {
      id,
      key: id,
      username,
    };

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { success: false, error: "创建用户失败" },
      { status: 400 },
    );
  }
}

// PUT - 更新用户（支持修改用户名和密码）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, password } = body;
    const now = getCurrentTime();

    // 检查用户是否存在
    const checkStmt = db.prepare("SELECT id FROM users WHERE id = ?");
    const existing = checkStmt.get(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 },
      );
    }

    // 记录操作前的数据（自动备份）
    recordOperation("users", "update", id);

    // 构建更新语句
    const updates: string[] = [];
    const values: any[] = [];

    if (username !== undefined) {
      updates.push("username = ?");
      values.push(username);
    }

    if (password !== undefined) {
      updates.push("password = ?");
      values.push(password);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有提供要更新的字段" },
        { status: 400 },
      );
    }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    const stmt = db.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    );
    stmt.run(...values);

    // 获取更新后的用户
    const getStmt = db.prepare("SELECT id, username FROM users WHERE id = ?");
    const user = getStmt.get(id);

    return NextResponse.json({
      success: true,
      user: { ...(user as any), key: (user as any).id },
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { success: false, error: "更新用户失败" },
      { status: 400 },
    );
  }
}

// DELETE - 删除用户
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少用户 ID" },
        { status: 400 },
      );
    }

    // 检查用户是否存在
    const checkStmt = db.prepare("SELECT id FROM users WHERE id = ?");
    const existing = checkStmt.get(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 },
      );
    }

    // 记录操作前的数据（自动备份）
    recordOperation("users", "delete", id);

    // 删除用户
    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    stmt.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { success: false, error: "删除用户失败" },
      { status: 400 },
    );
  }
}
