import { NextResponse } from "next/server";
import { recordOperation } from "@/lib/backup";
import { db } from "@/lib/db";

// 删除侧边栏配置项
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "缺少必需的 id 参数" },
        { status: 400 },
      );
    }

    // 记录操作前的数据（自动备份）
    recordOperation("sidebar_items", "delete", id);

    db.prepare("DELETE FROM sidebar_items WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete sidebar item:", error);
    return NextResponse.json({ error: "删除侧边栏配置失败" }, { status: 500 });
  }
}

// 批量更新侧边栏排序
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items 必须是数组" }, { status: 400 });
    }

    // 记录操作前的数据（自动备份）- 记录所有受影响的项
    for (const item of items) {
      recordOperation("sidebar_items", "update", item.id);
    }

    const now = new Date().toLocaleString("zh-CN");
    const updateStmt = db.prepare(`
      UPDATE sidebar_items
      SET sort_order = ?, updated_at = ?
      WHERE id = ?
    `);

    const updateMany = db.transaction((items: any[]) => {
      for (const item of items) {
        updateStmt.run(item.sort_order, now, item.id);
      }
    });

    updateMany(items);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder sidebar items:", error);
    return NextResponse.json({ error: "更新侧边栏排序失败" }, { status: 500 });
  }
}
