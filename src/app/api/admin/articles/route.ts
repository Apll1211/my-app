import { NextResponse } from "next/server";
import { db, generateId, getCurrentTime } from "@/lib/db";

// 指定使用 Node.js runtime
export const runtime = "nodejs";

// POST /api/admin/articles - 管理员创建文章
export async function POST(request: Request) {
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
    const finalSlug = slug || title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    // 检查 slug 是否已存在
    const existing = db.prepare("SELECT id FROM articles WHERE slug = ?").get(finalSlug);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "该 slug 已存在，请使用不同的标题或指定唯一 slug" },
        { status: 400 },
      );
    }

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

// GET /api/admin/articles - 获取所有文章（包括草稿）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    // 获取总记录数
    const countStmt = db.prepare("SELECT COUNT(*) as total FROM articles");
    const countResult: any = countStmt.get();
    const total = countResult.total;

    // 获取分页数据
    const stmt = db.prepare(`
      SELECT id, title, slug, excerpt, category, tags, status, views, likes, created_at, updated_at 
      FROM articles 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const articles = stmt.all(limit, offset);

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
      { success: false, error: "获取文章列表失败" },
      { status: 500 },
    );
  }
}