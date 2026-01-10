import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 指定使用 Node.js runtime（better-sqlite3 需要）
export const runtime = "nodejs";

// GET - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    // 获取视频总数
    const videoCountStmt = db.prepare("SELECT COUNT(*) as total FROM videos");
    const videoCountResult: any = videoCountStmt.get();
    const totalVideos = videoCountResult.total;

    // 获取用户总数
    const userCountStmt = db.prepare("SELECT COUNT(*) as total FROM users");
    const userCountResult: any = userCountStmt.get();
    const totalUsers = userCountResult.total;

    // 获取总播放量
    const viewsStmt = db.prepare(
      "SELECT SUM(views) as total FROM videos WHERE views IS NOT NULL"
    );
    const viewsResult: any = viewsStmt.get();
    const totalViews = viewsResult.total || 0;

    // 获取总点赞数
    const likesStmt = db.prepare(
      "SELECT SUM(likes) as total FROM videos WHERE likes IS NOT NULL"
    );
    const likesResult: any = likesStmt.get();
    const totalLikes = likesResult.total || 0;

    return NextResponse.json({
      stats: {
        totalVideos,
        totalUsers,
        totalViews,
        totalLikes,
      },
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      {
        error: "获取统计数据失败",
        details: String(error),
        stats: { totalVideos: 0, totalUsers: 0, totalViews: 0, totalLikes: 0 }
      },
      { status: 500 }
    );
  }
}