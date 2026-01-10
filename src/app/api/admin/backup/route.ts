import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 创建备份（在操作前调用）
export async function POST(request: NextRequest) {
  try {
    const { table_name, record_id, user_id } = await request.json();

    if (!table_name) {
      return NextResponse.json({ error: "缺少表名" }, { status: 400 });
    }

    // 获取当前记录
    let record: any;
    if (record_id) {
      record = db
        .prepare(`SELECT * FROM ${table_name} WHERE id = ?`)
        .get(record_id);
    } else {
      // 如果没有 record_id，备份整个表
      record = db.prepare(`SELECT * FROM ${table_name}`).all();
    }

    if (!record) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    const now = new Date().toLocaleString("zh-CN");

    // 创建操作日志
    const logResult = db
      .prepare(`
      INSERT INTO operation_logs (operation_type, table_name, operation, record_id, old_data, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        "backup",
        table_name,
        "backup",
        record_id || null,
        JSON.stringify(record),
        user_id || null,
        now,
      );

    const logId = logResult.lastInsertRowid;

    // 创建备份记录
    if (record_id) {
      // 单条记录备份
      db.prepare(`
        INSERT INTO operation_backups (operation_log_id, table_name, record_id, record_data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(logId, table_name, record_id, JSON.stringify(record), now);
    } else {
      // 整表备份
      const records = record as any[];
      records.forEach((r) => {
        db.prepare(`
          INSERT INTO operation_backups (operation_log_id, table_name, record_id, record_data, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(logId, table_name, r.id, JSON.stringify(r), now);
      });
    }

    return NextResponse.json({
      success: true,
      log_id: logId,
      message: "备份成功",
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "备份失败" }, { status: 500 });
  }
}

// 获取备份列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table_name = searchParams.get("table_name");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = `
      SELECT * FROM operation_logs 
      WHERE operation_type = 'backup'
    `;
    const params: any[] = [];

    if (table_name) {
      query += " AND table_name = ?";
      params.push(table_name);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const logs = db.prepare(query).all(...params);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Get backups error:", error);
    return NextResponse.json({ error: "获取备份列表失败" }, { status: 500 });
  }
}
