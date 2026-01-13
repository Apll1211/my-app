import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories - 获取所有文章分类
export async function GET() {
  try {
    const categories = db
      .prepare(`
        SELECT id, name, slug, description, sort_order
        FROM categories
        ORDER BY sort_order ASC
      `)
      .all();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "获取分类失败",
      },
      { status: 500 },
    );
  }
}