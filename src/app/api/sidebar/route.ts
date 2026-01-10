import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOperation } from "@/lib/backup";

// 获取侧边栏配置
export async function GET() {
  try {
    const items = db
      .prepare(`
        SELECT id, label, icon_name, path, sort_order, item_type, active
        FROM sidebar_items
        WHERE active = 1
        ORDER BY sort_order ASC
      `)
      .all();

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch sidebar items:", error);
    return NextResponse.json(
      { error: "获取侧边栏配置失败" },
      { status: 500 }
    );
  }
}

// 更新侧边栏配置
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, label, icon_name, path, sort_order, item_type, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "缺少必需的 id 参数" },
        { status: 400 }
      );
    }

    // 记录操作前的数据（自动备份）
    recordOperation("sidebar_items", "update", id);

    const now = new Date().toLocaleString("zh-CN");

    db.prepare(`
      UPDATE sidebar_items
      SET label = ?, icon_name = ?, path = ?, sort_order = ?, item_type = ?, active = ?, updated_at = ?
      WHERE id = ?
    `).run(label, icon_name, path, sort_order, item_type, active, now, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update sidebar item:", error);
    return NextResponse.json(
      { error: "更新侧边栏配置失败" },
      { status: 500 }
    );
  }
}

// 添加侧边栏配置项
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, icon_name, path, sort_order, item_type, active } = body;

    // 分割线不需要 label，但按钮需要
    if (item_type !== "divider" && !label) {
      return NextResponse.json(
        { error: "缺少必需的 label 参数" },
        { status: 400 }
      );
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toLocaleString("zh-CN");

    db.prepare(`
      INSERT INTO sidebar_items (id, label, icon_name, path, sort_order, item_type, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, label || null, icon_name || null, path || null, sort_order || 0, item_type || "button", active ?? 1, now, now);

    // 记录插入操作（用于撤销）
    recordOperation("sidebar_items", "insert", id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to add sidebar item:", error);
    return NextResponse.json(
      { error: "添加侧边栏配置失败" },
      { status: 500 }
    );
  }
}