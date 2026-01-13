import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 指定使用 Node.js runtime（better-sqlite3 需要）
export const runtime = "nodejs";

// GET - 搜索文章
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // 如果没有搜索关键词，返回空结果
    if (!query.trim()) {
      return NextResponse.json({
        articles: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false,
        },
      });
    }

    // 计算分页
    const offset = (page - 1) * limit;

    // 构建搜索条件（在标题、作者、描述、标签中搜索）
    const searchPattern = `%${query}%`;
    const whereClause = `
      title LIKE ? OR
      author LIKE ? OR
      description LIKE ? OR
      tags LIKE ?
    `;

    // 获取总记录数
    const countStmt = db.prepare(
      `SELECT COUNT(*) as total FROM articles WHERE ${whereClause}`,
    );
    const countResult: any = countStmt.get(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
    );
    const total = countResult.total;

    // 获取分页数据
    const stmt = db.prepare(
      `SELECT * FROM articles WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    );
    const articles = stmt.all(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      limit,
      offset,
    );

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "搜索失败", details: String(error) },
      { status: 500 },
    );
  }
}