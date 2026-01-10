import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // 批量更新所有图标名称为 Lucide 集合的图标名称
    const iconMapping: Record<string, string> = {
      VideoCameraOutlined: "video",
      UserOutlined: "user",
      AppstoreOutlined: "database",
      MenuOutlined: "menu",
      RadioOutlined: "radio",
      DatabaseOutlined: "database",
    };

    for (const [oldIcon, newIcon] of Object.entries(iconMapping)) {
      db.prepare(`
        UPDATE admin_menu_items
        SET icon_name = ?
        WHERE icon_name = ?
      `).run(newIcon, oldIcon);
    }

    return NextResponse.json({ success: true, message: "图标更新成功" });
  } catch (error) {
    console.error("Failed to update menu icon:", error);
    return NextResponse.json(
      { error: "图标更新失败" },
      { status: 500 }
    );
  }
}
