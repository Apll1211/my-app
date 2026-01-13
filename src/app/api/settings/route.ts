import { NextResponse } from "next/server";
import { db, getCurrentTime } from "@/lib/db";

// 指定使用 Node.js runtime
export const runtime = "nodejs";

// GET /api/settings - 获取博客设置
export async function GET() {
  try {
    const settings = db.prepare("SELECT key, value FROM settings").all();
    
    // 转换为对象格式
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: settingsObj,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取设置失败" },
      { status: 500 },
    );
  }
}

// PUT /api/settings - 更新博客设置
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const now = getCurrentTime();

    // 批量更新设置
    const updateStmt = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `);

    const updates = Object.entries(body).map(([key, value]) => {
      return updateStmt.run(key, String(value), now);
    });

    return NextResponse.json({
      success: true,
      message: "设置更新成功",
      updated: updates.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "更新设置失败" },
      { status: 500 },
    );
  }
}