import { type NextRequest, NextResponse } from "next/server";
import { db, generateId, getCurrentTime } from "@/lib/db";

// 指定使用 Node.js runtime（better-sqlite3 需要）
export const runtime = "nodejs";

// POST - 点赞视频
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, userId, userNickname } = body;

    // 验证必填字段
    if (!videoId || !userId) {
      return NextResponse.json(
        { error: "缺少必填字段：videoId, userId" },
        { status: 400 }
      );
    }

    // 检查是否已经点赞
    const checkStmt = db.prepare(
      "SELECT id FROM video_likes WHERE video_id = ? AND user_id = ?"
    );
    const existing = checkStmt.get(videoId, userId);

    if (existing) {
      return NextResponse.json(
        { error: "已经点赞过了" },
        { status: 400 }
      );
    }

    // 插入点赞记录
    const id = generateId();
    const now = getCurrentTime();
    const insertStmt = db.prepare(`
      INSERT INTO video_likes (id, video_id, user_id, user_nickname, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run(id, videoId, userId, userNickname || "", now);

    // 更新视频的点赞数
    const updateStmt = db.prepare(
      "UPDATE videos SET likes = likes + 1 WHERE id = ?"
    );
    updateStmt.run(videoId);

    // 获取更新后的点赞数
    const countStmt = db.prepare("SELECT likes FROM videos WHERE id = ?");
    const video = countStmt.get(videoId) as { likes: number };

    return NextResponse.json({
      success: true,
      liked: true,
      likes: video.likes,
    });
  } catch (error) {
    console.error("Failed to like video:", error);
    return NextResponse.json(
      { error: "点赞失败", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - 取消点赞
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("videoId");
    const userId = searchParams.get("userId");

    // 验证必填字段
    if (!videoId || !userId) {
      return NextResponse.json(
        { error: "缺少必填参数：videoId, userId" },
        { status: 400 }
      );
    }

    // 删除点赞记录
    const deleteStmt = db.prepare(
      "DELETE FROM video_likes WHERE video_id = ? AND user_id = ?"
    );
    const result = deleteStmt.run(videoId, userId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "未找到点赞记录" },
        { status: 404 }
      );
    }

    // 更新视频的点赞数
    const updateStmt = db.prepare(
      "UPDATE videos SET likes = likes - 1 WHERE id = ?"
    );
    updateStmt.run(videoId);

    // 获取更新后的点赞数
    const countStmt = db.prepare("SELECT likes FROM videos WHERE id = ?");
    const video = countStmt.get(videoId) as { likes: number };

    return NextResponse.json({
      success: true,
      liked: false,
      likes: video.likes,
    });
  } catch (error) {
    console.error("Failed to unlike video:", error);
    return NextResponse.json(
      { error: "取消点赞失败", details: String(error) },
      { status: 500 }
    );
  }
}

// GET - 获取点赞状态和点赞列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("videoId");
    const userId = searchParams.get("userId");

    if (!videoId) {
      return NextResponse.json(
        { error: "缺少必填参数：videoId" },
        { status: 400 }
      );
    }

    // 获取视频的点赞数
    const videoStmt = db.prepare("SELECT likes FROM videos WHERE id = ?");
    const video = videoStmt.get(videoId) as { likes: number } | undefined;

    if (!video) {
      return NextResponse.json(
        { error: "视频不存在" },
        { status: 404 }
      );
    }

    // 检查用户是否已点赞
    let liked = false;
    if (userId) {
      const checkStmt = db.prepare(
        "SELECT id FROM video_likes WHERE video_id = ? AND user_id = ?"
      );
      const existing = checkStmt.get(videoId, userId);
      liked = !!existing;
    }

    // 获取点赞列表（最近20条）
    const likesStmt = db.prepare(`
      SELECT user_id, user_nickname, created_at
      FROM video_likes
      WHERE video_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `);
    const likesList = likesStmt.all(videoId);

    return NextResponse.json({
      success: true,
      likes: video.likes,
      liked,
      likesList,
    });
  } catch (error) {
    console.error("Failed to get likes:", error);
    return NextResponse.json(
      { error: "获取点赞信息失败", details: String(error) },
      { status: 500 }
    );
  }
}