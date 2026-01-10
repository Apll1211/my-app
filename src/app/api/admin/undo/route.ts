import { NextRequest, NextResponse } from "next/server";
import { db, getCurrentTime } from "@/lib/db";

// GET - 获取最近的操作记录
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tableName = searchParams.get("table_name");
    const limit = parseInt(searchParams.get("limit") || "10");

    let query = `
      SELECT * FROM recent_operations 
      WHERE created_at > datetime('now', '-24 hours')
    `;
    const params: any[] = [];

    if (tableName) {
      query += ` AND table_name = ?`;
      params.push(tableName);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const logs = db.prepare(query).all(...params);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to fetch recent operations:", error);
    return NextResponse.json(
      { error: "获取操作记录失败" },
      { status: 500 }
    );
  }
}

// POST - 执行撤销操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { log_id } = body;

    if (!log_id) {
      return NextResponse.json(
        { error: "缺少操作记录 ID" },
        { status: 400 }
      );
    }

    // 获取操作记录
    const log = db
      .prepare("SELECT * FROM recent_operations WHERE id = ?")
      .get(log_id) as any;

    if (!log) {
      return NextResponse.json(
        { error: "操作记录不存在" },
        { status: 404 }
      );
    }

    // 解析旧数据
    const oldData = JSON.parse(log.old_data);

    // 根据操作类型执行撤销
    if (log.operation_type === "delete") {
      // 恢复删除的记录
      const columns = Object.keys(oldData).join(", ");
      const placeholders = Object.keys(oldData)
        .map(() => "?")
        .join(", ");
      const values = Object.values(oldData);

      db.prepare(
        `INSERT INTO ${log.table_name} (${columns}) VALUES (${placeholders})`
      ).run(...values);
    } else if (log.operation_type === "update") {
      // 恢复更新前的数据
      const setClause = Object.keys(oldData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(oldData), log.record_id];

      db.prepare(
        `UPDATE ${log.table_name} SET ${setClause} WHERE id = ?`
      ).run(...values);
    } else if (log.operation_type === "insert") {
      // 删除新插入的记录
      db.prepare(`DELETE FROM ${log.table_name} WHERE id = ?`).run(
        log.record_id
      );
    }

    // 删除已撤销的操作记录
    db.prepare("DELETE FROM recent_operations WHERE id = ?").run(log_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to undo operation:", error);
    return NextResponse.json({ error: "撤销失败" }, { status: 500 });
  }
}