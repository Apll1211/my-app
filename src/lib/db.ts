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
    const dbPath = path.join(dbDir, "douyin.db");

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

    // 视频表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        author_id TEXT,
        description TEXT,
        thumbnail TEXT,
        video_url TEXT NOT NULL,
        duration TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        status TEXT DEFAULT '已发布',
        file_path TEXT,
        folder_path TEXT,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 检查并添加 tags 字段（用于已存在的数据库）
    try {
      const columns = _db.prepare("PRAGMA table_info(videos)").all() as any[];
      const hasTagsColumn = columns.some((col: any) => col.name === "tags");
      if (!hasTagsColumn) {
        _db.exec("ALTER TABLE videos ADD COLUMN tags TEXT");
        console.log("Added tags column to videos table");
      }
    } catch (error) {
      console.log("Tags column check skipped:", error);
    }

    // 检查并添加 author_id 字段（用于已存在的数据库）
    try {
      const columns = _db.prepare("PRAGMA table_info(videos)").all() as any[];
      const hasAuthorIdColumn = columns.some((col: any) => col.name === "author_id");
      if (!hasAuthorIdColumn) {
        _db.exec("ALTER TABLE videos ADD COLUMN author_id TEXT");
        console.log("Added author_id column to videos table");
      }
    } catch (error) {
      console.log("Author_id column check skipped:", error);
    }

    // 分类表
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

    // 直播源表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS live_streams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        group_title TEXT,
        logo TEXT,
        tvg_id TEXT,
        tvg_name TEXT,
        tvg_logo TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 后台管理菜单表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS admin_menu_items (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        icon_name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 最近操作记录表（用于自动备份和撤销）
    _db.exec(`
      CREATE TABLE IF NOT EXISTS recent_operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        record_id TEXT,
        old_data TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // 视频点赞表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS video_likes (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_nickname TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(video_id, user_id)
      )
    `);

    // 创建索引以提高查询性能
    _db.exec(`
      CREATE INDEX IF NOT EXISTS idx_recent_operations_table
      ON recent_operations(table_name, created_at DESC);
    `);

    _db.exec(`
      CREATE INDEX IF NOT EXISTS idx_video_likes_video_id
      ON video_likes(video_id);
    `);

    _db.exec(`
      CREATE INDEX IF NOT EXISTS idx_video_likes_user_id
      ON video_likes(user_id);
    `);

    // 初始化默认分类数据
    const defaultCategories = [
      { id: "all", label: "全部", sort_order: 0 },
      { id: "course", label: "公开课", sort_order: 1 },
      { id: "game", label: "游戏", sort_order: 2 },
      { id: "anime", label: "二次元", sort_order: 3 },
      { id: "music", label: "音乐", sort_order: 4 },
      { id: "movie", label: "影视", sort_order: 5 },
      { id: "food", label: "美食", sort_order: 6 },
      { id: "knowledge", label: "知识", sort_order: 7 },
      { id: "theater", label: "小剧场", sort_order: 8 },
      { id: "vlog", label: "生活vlog", sort_order: 9 },
      { id: "sports", label: "体育", sort_order: 10 },
      { id: "travel", label: "旅行", sort_order: 11 },
      { id: "parenting", label: "亲子", sort_order: 12 },
      { id: "animals", label: "动物", sort_order: 13 },
      { id: "agriculture", label: "三农", sort_order: 14 },
      { id: "cars", label: "汽车", sort_order: 15 },
      { id: "beauty", label: "美妆", sort_order: 16 },
      { id: "fashion", label: "穿搭", sort_order: 17 },
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

    // 初始化默认侧边栏配置数据
    const defaultSidebarItems = [
      {
        id: "featured",
        label: "精选",
        icon_name: "Home",
        path: "/",
        sort_order: 0,
        item_type: "button",
      },
      {
        id: "recommend",
        label: "推荐",
        icon_name: "Compass",
        path: "/recommend",
        sort_order: 1,
        item_type: "button",
      },
      {
        id: "ai-douyin",
        label: "AI GenVio",
        icon_name: "Sparkles",
        path: "/ai",
        sort_order: 2,
        item_type: "button",
      },
      {
        id: "creative",
        label: "创意",
        icon_name: "Palette",
        path: "/creative",
        sort_order: 3,
        item_type: "button",
      },
      {
        id: "divider-1",
        label: "",
        icon_name: null,
        path: null,
        sort_order: 4,
        item_type: "divider",
      },
      {
        id: "following",
        label: "关注",
        icon_name: "Heart",
        path: "/follow",
        sort_order: 5,
        item_type: "button",
      },
      {
        id: "friends",
        label: "朋友",
        icon_name: "Users",
        path: "/friends",
        sort_order: 6,
        item_type: "button",
      },
      {
        id: "profile",
        label: "我的",
        icon_name: "User",
        path: "/profile",
        sort_order: 7,
        item_type: "button",
      },
      {
        id: "divider-2",
        label: "",
        icon_name: null,
        path: null,
        sort_order: 8,
        item_type: "divider",
      },
      {
        id: "live",
        label: "直播",
        icon_name: "Radio",
        path: "/live",
        sort_order: 9,
        item_type: "button",
      },
      {
        id: "cinema",
        label: "放映厅",
        icon_name: "Film",
        path: "/cinema",
        sort_order: 10,
        item_type: "button",
      },
      {
        id: "drama",
        label: "短剧",
        icon_name: "PlayCircle",
        path: "/drama",
        sort_order: 11,
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

    // 初始化默认后台管理菜单数据
    const defaultAdminMenuItems = [
      {
        id: "admin-menu-videos",
        key: "videos",
        label: "视频管理",
        icon_name: "video",
        sort_order: 0,
      },
      {
        id: "admin-menu-users",
        key: "users",
        label: "用户管理",
        icon_name: "user",
        sort_order: 1,
      },
      {
        id: "admin-menu-categories",
        key: "categories",
        label: "分类管理",
        icon_name: "database",
        sort_order: 2,
      },
      {
        id: "admin-menu-sidebar",
        key: "sidebar",
        label: "侧边栏管理",
        icon_name: "menu",
        sort_order: 3,
      },
      {
        id: "admin-menu-livestreams",
        key: "livestreams",
        label: "直播源管理",
        icon_name: "radio",
        sort_order: 4,
      },
      {
        id: "admin-menu-jsonserver",
        key: "jsonserver",
        label: "JSON Server",
        icon_name: "database",
        sort_order: 5,
      },
    ];

    // 检查是否已有后台管理菜单数据
    const adminMenuCount = _db
      .prepare("SELECT COUNT(*) as count FROM admin_menu_items")
      .get() as { count: number };
    if (adminMenuCount.count === 0) {
      const insertAdminMenuItem = _db.prepare(`
        INSERT INTO admin_menu_items (id, key, label, icon_name, sort_order, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `);

      const now = getCurrentTime();
      defaultAdminMenuItems.forEach((item) => {
        insertAdminMenuItem.run(
          item.id,
          item.key,
          item.label,
          item.icon_name,
          item.sort_order,
          now,
          now,
        );
      });
      console.log("Initialized default admin menu items");
    }

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
