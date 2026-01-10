import { type NextRequest, NextResponse } from "next/server";
import { db, generateId, getCurrentTime } from "@/lib/db";
import { recordOperation } from "@/lib/backup";

// GET /api/admin/categories - 获取所有分类（包括禁用的，懒加载）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const lastId = searchParams.get("lastId"); // 游标：最后一条记录的ID

    let categories: any[];

    if (lastId) {
      // 基于游标的分页：获取比 lastId 序列更靠后的记录
      const stmt = db.prepare(
        "SELECT id, label, sort_order, active, created_at, updated_at FROM categories WHERE sort_order > (SELECT sort_order FROM categories WHERE id = ?) ORDER BY sort_order ASC LIMIT ?"
      );
      categories = stmt.all(lastId, limit);
    } else {
      // 首次加载
      categories = db
        .prepare(`
          SELECT id, label, sort_order, active, created_at, updated_at
          FROM categories
          ORDER BY sort_order ASC
          LIMIT ?
        `)
        .all(limit);
    }

    // 判断是否还有更多数据
    const hasMore = categories.length === limit;

    return NextResponse.json({
      success: true,
      categories,
      hasMore,
      lastId: categories.length > 0 ? categories[categories.length - 1].id : null,
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

// POST /api/admin/categories - 添加新分类
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, sort_order = 0, active = 1 } = body;

    if (!label) {
      return NextResponse.json(
        {
          success: false,
          error: "分类名称不能为空",
        },
        { status: 400 },
      );
    }

    const id = generateId();
    const now = getCurrentTime();

    db.prepare(`
      INSERT INTO categories (id, label, sort_order, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, label, sort_order, active, now, now);

    return NextResponse.json({
      success: true,
      message: "添加成功",
      category: {
        id,
        label,
        sort_order,
        active,
        created_at: now,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "添加分类失败",
      },
      { status: 500 },
    );
  }
}

// PUT /api/admin/categories - 更新分类
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, label, sort_order, active } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "分类ID不能为空",
        },
        { status: 400 },
      );
    }

    const now = getCurrentTime();
    const updates: string[] = [];
    const values: any[] = [];

    if (label !== undefined) {
      updates.push("label = ?");
      values.push(label);
    }
    if (sort_order !== undefined) {
      updates.push("sort_order = ?");
      values.push(sort_order);
    }
    if (active !== undefined) {
      updates.push("active = ?");
      values.push(active);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "没有要更新的字段",
        },
        { status: 400 },
      );
    }

    // 记录操作前的数据（自动备份）
    recordOperation("categories", "update", id);

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    const result = db
      .prepare(`
        UPDATE categories
        SET ${updates.join(", ")}
        WHERE id = ?
      `)
      .run(...values);

    if (result.changes === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "分类不存在",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "更新成功",
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "更新分类失败",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/categories - 删除分类
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "分类ID不能为空",
        },
        { status: 400 },
      );
    }

    // 记录操作前的数据（自动备份）
    recordOperation("categories", "delete", id);

    const result = db
      .prepare(`
        DELETE FROM categories
        WHERE id = ?
      `)
      .run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "分类不存在",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "删除分类失败",
      },
      { status: 500 },
    );
  }
}
