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

    // 博客文章表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        cover_image TEXT,
        status TEXT DEFAULT 'published',
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 博客分类表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 博客设置表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 友链表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        logo TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 评论表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        article_id TEXT NOT NULL,
        author TEXT NOT NULL,
        email TEXT,
        content TEXT NOT NULL,
        parent_id TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);

    // 初始化默认博客分类数据
    const defaultCategories = [
      { id: "tech", name: "技术", slug: "tech", description: "技术分享与探索", sort_order: 0 },
      { id: "life", name: "生活", slug: "life", description: "生活记录与感悟", sort_order: 1 },
      { id: "thoughts", name: "思考", slug: "thoughts", description: "思考与见解", sort_order: 2 },
      { id: "tutorial", name: "教程", slug: "tutorial", description: "教程与指南", sort_order: 3 },
      { id: "notes", name: "笔记", slug: "notes", description: "学习笔记", sort_order: 4 },
    ];

    // 检查是否已有分类数据
    const categoryCount = _db
      .prepare("SELECT COUNT(*) as count FROM categories")
      .get() as { count: number };
    
    if (categoryCount.count === 0) {
      const insertCategory = _db.prepare(`
        INSERT INTO categories (id, name, slug, description, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const now = getCurrentTime();
      defaultCategories.forEach((cat) => {
        insertCategory.run(cat.id, cat.name, cat.slug, cat.description, cat.sort_order, now, now);
      });
    }

    // 初始化博客设置
    const defaultSettings = [
      { key: "blog_title", value: "我的博客", updated_at: getCurrentTime() },
      { key: "blog_description", value: "记录思考与分享", updated_at: getCurrentTime() },
      { key: "author_name", value: "作者", updated_at: getCurrentTime() },
      { key: "theme", value: "dark", updated_at: getCurrentTime() },
    ];

    const settingsCount = _db
      .prepare("SELECT COUNT(*) as count FROM settings")
      .get() as { count: number };
    
    if (settingsCount.count === 0) {
      const insertSetting = _db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `);

      defaultSettings.forEach((setting) => {
        insertSetting.run(setting.key, setting.value, setting.updated_at);
      });
    }

    return _db;
  } catch (error) {
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