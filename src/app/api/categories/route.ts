import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories - 获取所有分类
export async function GET() {
  try {
    const categories = db
      .prepare(`
        SELECT id, label, sort_order, active
        FROM categories
        WHERE active = 1
        ORDER BY sort_order ASC
      `)
      .all();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取分类失败",
      },
      { status: 500 },
    );
  }
}
