import { NextResponse } from "next/server";
import { db, getCurrentTime } from "@/lib/db";

// POST /api/admin/categories/reorder - 批量更新分类排序
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categories } = body;

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        {
          success: false,
          error: "分类数据格式错误",
        },
        { status: 400 },
      );
    }

    // 使用事务批量更新
    const update = db.transaction(() => {
      categories.forEach((category: any) => {
        db.prepare(`
          UPDATE categories
          SET sort_order = ?, updated_at = ?
          WHERE id = ?
        `).run(category.sort_order, getCurrentTime(), category.id);
      });
    });

    update();

    return NextResponse.json({
      success: true,
      message: "排序已更新",
    });
  } catch (error) {
    console.error("Error reordering categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "排序更新失败",
      },
      { status: 500 },
    );
  }
}
