import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 获取后台管理菜单
export async function GET() {
  try {
    const items = db
      .prepare(`
        SELECT id, key, label, icon_name, sort_order, active
        FROM admin_menu_items
        WHERE active = 1
        ORDER BY sort_order ASC
      `)
      .all();

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch admin menu items:", error);
    return NextResponse.json(
      { error: "获取后台管理菜单失败" },
      { status: 500 }
    );
  }
}