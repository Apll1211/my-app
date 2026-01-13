import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// 数据库实例类型
let _db: Database.Database | null = null;

// 初始化数据库
function initDatabase(): Database.Database {
  if (_db) {
    return _db;
  }

  try {
    // 数据库文件路径
    const dbDir = path.join(process.cwd(), "data");
    const dbPath = path.join(dbDir, "genvio.db");

    // 确保数据目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 创建数据库连接（单例模式）
    _db = new Database(dbPath);

    // 启用 WAL 模式以提高并发性能
    _db.pragma("journal_mode = WAL");

    // 用户表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nickname TEXT,
        bio TEXT,
        avatar TEXT,
        role TEXT DEFAULT '普通用户',
        status TEXT DEFAULT '正常',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 检查并移除 email 字段（用于已存在的数据库）
    try {
      const columns = _db.prepare("PRAGMA table_info(users)").all() as any[];
      const hasEmailColumn = columns.some((col: any) => col.name === "email");
      if (hasEmailColumn) {
        // SQLite 不支持直接删除列，需要重建表
        _db.exec(`
          CREATE TABLE users_new (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nickname TEXT,
            bio TEXT,
            avatar TEXT,
            role TEXT DEFAULT '普通用户',
            status TEXT DEFAULT '正常',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          INSERT INTO users_new (id, username, password, role, status, created_at, updated_at)
          SELECT id, username, password, role, status, created_at, updated_at FROM users;
          DROP TABLE users;
          ALTER TABLE users_new RENAME TO users;
        `);
        console.log("Removed email column from users table");
      }
    } catch (error) {
      console.log("Email column removal skipped:", error);
    }

    // 检查并添加 nickname、bio、avatar 字段（用于已存在的数据库）
    try {
      const columns = _db.prepare("PRAGMA table_info(users)").all() as any[];
      const hasNicknameColumn = columns.some(
        (col: any) => col.name === "nickname",
      );
      const hasBioColumn = columns.some((col: any) => col.name === "bio");
      const hasAvatarColumn = columns.some((col: any) => col.name === "avatar");

      if (!hasNicknameColumn) {
        _db.exec("ALTER TABLE users ADD COLUMN nickname TEXT");
        console.log("Added nickname column to users table");
      }
      if (!hasBioColumn) {
        _db.exec("ALTER TABLE users ADD COLUMN bio TEXT");
        console.log("Added bio column to users table");
      }
      if (!hasAvatarColumn) {
        _db.exec("ALTER TABLE users ADD COLUMN avatar TEXT");
        console.log("Added avatar column to users table");
      }
    } catch (error) {
      console.log("User profile columns check skipped:", error);
    }

    // 文章分类表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 设置表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 侧边栏配置表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS sidebar_items (
        id TEXT PRIMARY KEY,
        label TEXT,
        icon_name TEXT,
        path TEXT,
        sort_order INTEGER DEFAULT 0,
        item_type TEXT DEFAULT 'button',
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 检查并修改 label 字段为允许 NULL（用于已存在的数据库）
    try {
      const columns = _db
        .prepare("PRAGMA table_info(sidebar_items)")
        .all() as any[];
      const labelColumn = columns.find((col: any) => col.name === "label");
      if (labelColumn && labelColumn.notnull === 1) {
        // SQLite 不支持直接修改列约束，需要重建表
        _db.exec(`
          CREATE TABLE sidebar_items_new (
            id TEXT PRIMARY KEY,
            label TEXT,
            icon_name TEXT,
            path TEXT,
            sort_order INTEGER DEFAULT 0,
            item_type TEXT DEFAULT 'button',
            active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          INSERT INTO sidebar_items_new (id, label, icon_name, path, sort_order, item_type, active, created_at, updated_at)
          SELECT id, label, icon_name, path, sort_order, item_type, active, created_at, updated_at FROM sidebar_items;
          DROP TABLE sidebar_items;
          ALTER TABLE sidebar_items_new RENAME TO sidebar_items;
        `);
        console.log(
          "Modified label column to allow NULL in sidebar_items table",
        );
      }
    } catch (error) {
      console.log("Label column modification skipped:", error);
    }

    // 文章表（用于博客）
    _db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        author_id TEXT,
        description TEXT,
        content TEXT,
        thumbnail TEXT,
        category_id TEXT,
        tags TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        status TEXT DEFAULT '已发布',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // 检查并添加文章表字段（用于已存在的数据库）
    try {
      const columns = _db.prepare("PRAGMA table_info(articles)").all() as any[];
      const hasContentColumn = columns.some(
        (col: any) => col.name === "content",
      );
      const hasTagsColumn = columns.some((col: any) => col.name === "tags");
      const hasCategoryIdColumn = columns.some(
        (col: any) => col.name === "category_id",
      );

      if (!hasContentColumn) {
        _db.exec("ALTER TABLE articles ADD COLUMN content TEXT");
        console.log("Added content column to articles table");
      }
      if (!hasTagsColumn) {
        _db.exec("ALTER TABLE articles ADD COLUMN tags TEXT");
        console.log("Added tags column to articles table");
      }
      if (!hasCategoryIdColumn) {
        _db.exec("ALTER TABLE articles ADD COLUMN category_id TEXT");
        console.log("Added category_id column to articles table");
      }
    } catch (error) {
      console.log("Article columns check skipped:", error);
    }

    // 初始化默认博客分类数据
    const defaultCategories = [
      { id: "tech", label: "技术", sort_order: 0 },
      { id: "life", label: "生活", sort_order: 1 },
      { id: "thoughts", label: "思考", sort_order: 2 },
      { id: "tutorial", label: "教程", sort_order: 3 },
      { id: "notes", label: "笔记", sort_order: 4 },
    ];

    // 检查是否已有分类数据
    const categoryCount = _db
      .prepare("SELECT COUNT(*) as count FROM categories")
      .get() as { count: number };
    if (categoryCount.count === 0) {
      const insertCategory = _db.prepare(`
        INSERT INTO categories (id, label, sort_order, active, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?)
      `);

      const now = getCurrentTime();
      defaultCategories.forEach((cat) => {
        insertCategory.run(cat.id, cat.label, cat.sort_order, now, now);
      });
      console.log("Initialized default categories");
    }

    // 初始化默认侧边栏配置数据（博客专用）
    const defaultSidebarItems = [
      {
        id: "home",
        label: "首页",
        icon_name: "Home",
        path: "/",
        sort_order: 0,
        item_type: "button",
      },
      {
        id: "categories",
        label: "分类",
        icon_name: "Compass",
        path: "/categories",
        sort_order: 1,
        item_type: "button",
      },
      {
        id: "archive",
        label: "归档",
        icon_name: "Sparkles",
        path: "/archive",
        sort_order: 2,
        item_type: "button",
      },
      {
        id: "about",
        label: "关于",
        icon_name: "Palette",
        path: "/about",
        sort_order: 3,
        item_type: "button",
      },
    ];

    // 检查是否已有侧边栏配置数据
    const sidebarCount = _db
      .prepare("SELECT COUNT(*) as count FROM sidebar_items")
      .get() as { count: number };
    if (sidebarCount.count === 0) {
      const insertSidebarItem = _db.prepare(`
        INSERT INTO sidebar_items (id, label, icon_name, path, sort_order, item_type, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `);

      const now = getCurrentTime();
      defaultSidebarItems.forEach((item) => {
        insertSidebarItem.run(
          item.id,
          item.label,
          item.icon_name,
          item.path,
          item.sort_order,
          item.item_type,
          now,
          now,
        );
      });
      console.log("Initialized default sidebar items");
    }

    // 操作记录表（用于备份和恢复）
    _db.exec(`
      CREATE TABLE IF NOT EXISTS recent_operations (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        record_id TEXT,
        old_data TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // 移除后台管理菜单相关代码（博客不需要）

    console.log("Database initialized successfully", { dbPath });
    return _db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

// 获取数据库实例
function getDb(): Database.Database {
  if (!_db) {
    return initDatabase();
  }
  return _db;
}

// 导出 db 实例（使用代理以延迟初始化）
export const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const database = getDb();
    return Reflect.get(database, prop);
  },
});

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 获取当前时间字符串
export function getCurrentTime(): string {
  return new Date().toLocaleString("zh-CN");
}
