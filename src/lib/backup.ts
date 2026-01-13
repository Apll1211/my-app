import { db, getCurrentTime, generateId } from "./db";

/**
 * 记录操作前的数据（自动备份）
 * @param tableName 表名
 * @param operationType 操作类型：delete, update, insert
 * @param recordId 记录ID
 */
export function recordOperation(
  tableName: string,
  operationType: "delete" | "update" | "insert",
  recordId?: string,
) {
  try {
    let oldData: any = null;

    if (operationType === "delete" || operationType === "update") {
      // 获取操作前的数据
      const record = db
        .prepare(`SELECT * FROM ${tableName} WHERE id = ?`)
        .get(recordId);
      oldData = record;
    }

    // 插入操作记录
    db.prepare(`
      INSERT INTO recent_operations (id, table_name, operation_type, record_id, old_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      tableName,
      operationType,
      recordId || null,
      oldData ? JSON.stringify(oldData) : null,
      getCurrentTime(),
    );

    // 清理超过24小时的旧记录
    db.prepare(`
      DELETE FROM recent_operations
      WHERE created_at < datetime('now', '-24 hours')
    `).run();

  } catch (error) {
    // 记录操作失败，静默处理
  }
}
