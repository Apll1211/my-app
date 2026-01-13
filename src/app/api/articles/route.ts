import { NextRequest, NextResponse } from "next/server";
import { db, generateId, getCurrentTime } from "@/lib/db";

// 指定使用 Node.js runtime
export const runtime = "nodejs";

// GET /api/articles - 获取文章列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    // 构建查询
    let whereClause = "WHERE status = 'published'";
    const params: any[] = [];

    if (category) {
      whereClause += " AND category = ?";
      params.push(category);
    }

    // 获取总记录数
    const countStmt = db.prepare(
      `SELECT COUNT(*) as total FROM articles ${whereClause}`,
    );
    const countResult: any = countStmt.get(...params);
    const total = countResult.total;

    // 获取分页数据
    const stmt = db.prepare(`
      SELECT id, title, slug, excerpt, category, tags, cover_image, views, likes, created_at 
      FROM articles 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const articles = stmt.all(...params, limit, offset);

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取文章失败" },
      { status: 500 },
    );
  }
}

// POST /api/articles - 创建文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, category, tags, cover_image, status } = body;

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "标题和内容为必填项" },
        { status: 400 },
      );
    }

    // 生成唯一 ID
    const id = generateId();
    const now = getCurrentTime();

    // 如果没有提供 slug，从标题生成
    const finalSlug = slug || title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

    // 插入文章
    const stmt = db.prepare(`
      INSERT INTO articles (id, title, slug, excerpt, content, category, tags, cover_image, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      title,
      finalSlug,
      excerpt || "",
      content,
      category || "",
      tags || "",
      cover_image || "",
      status || "published",
      now,
      now,
    );

    return NextResponse.json({
      success: true,
      data: { id, slug: finalSlug },
      message: "文章创建成功",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "创建文章失败" },
      { status: 500 },
    );
  }
}