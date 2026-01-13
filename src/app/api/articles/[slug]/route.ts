import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 指定使用 Node.js runtime
export const runtime = "nodejs";

// GET /api/articles/[slug] - 获取单篇文章详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 获取文章详情
    const stmt = db.prepare(`
      SELECT * FROM articles 
      WHERE slug = ? AND status = 'published'
    `);
    const article = stmt.get(slug);

    if (!article) {
      return NextResponse.json(
        { success: false, error: "文章不存在" },
        { status: 404 },
      );
    }

    // 增加浏览量
    const updateStmt = db.prepare(`
      UPDATE articles 
      SET views = views + 1 
      WHERE slug = ?
    `);
    updateStmt.run(slug);

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取文章失败" },
      { status: 500 },
    );
  }
}