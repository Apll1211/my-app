import { type NextRequest, NextResponse } from "next/server";
import { recordOperation } from "@/lib/backup";
import { db, generateId, getCurrentTime } from "@/lib/db";

// 指定使用 Node.js runtime（better-sqlite3 需要）
export const runtime = "nodejs";

// GET - 获取视频列表（懒加载）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const lastId = searchParams.get("lastId"); // 游标：最后一条记录的ID

    // 获取分页数据（返回所有视频，包括待审核的）
    let stmt: Database.Statement;
    let videos: any[];

    if (lastId) {
      // 基于游标的分页：获取比 lastId 更早的记录
      stmt = db.prepare(
        "SELECT id, title, author, views, likes, status, created_at as createTime FROM videos WHERE created_at < (SELECT created_at FROM videos WHERE id = ?) ORDER BY created_at DESC LIMIT ?",
      );
      videos = stmt.all(lastId, limit).map((video: any) => ({
        ...video,
        key: video.id,
      }));
    } else {
      // 首次加载
      stmt = db.prepare(
        "SELECT id, title, author, views, likes, status, created_at as createTime FROM videos ORDER BY created_at DESC LIMIT ?",
      );
      videos = stmt.all(limit).map((video: any) => ({
        ...video,
        key: video.id,
      }));
    }

    // 判断是否还有更多数据
    const hasMore = videos.length === limit;

    return NextResponse.json({
      videos,
      hasMore,
      lastId: videos.length > 0 ? videos[videos.length - 1].id : null,
    });
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return NextResponse.json(
      { error: "获取视频列表失败", details: String(error) },
      { status: 500 },
    );
  }
}

// POST - 创建新视频
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = generateId();
    const now = getCurrentTime();

    const stmt = db.prepare(
      `INSERT INTO videos (id, title, author, description, thumbnail, video_url, duration, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const newVideo = {
      id,
      key: id,
      title: body.title,
      author: body.author,
      description: body.description || "",
      thumbnail: body.thumbnail || "",
      video_url: body.video_url || "",
      duration: body.duration || "00:00",
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      status: body.status || "审核中",
      created_at: now,
      updated_at: now,
    };

    stmt.run(
      newVideo.id,
      newVideo.title,
      newVideo.author,
      newVideo.description,
      newVideo.thumbnail,
      newVideo.video_url,
      newVideo.duration,
      newVideo.status,
      newVideo.created_at,
      newVideo.updated_at,
    );

    return NextResponse.json(
      { success: true, video: newVideo },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create video:", error);
    return NextResponse.json(
      { success: false, error: "创建视频失败" },
      { status: 400 },
    );
  }
}

// PUT - 更新视频
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const now = getCurrentTime();

    // 检查视频是否存在
    const checkStmt = db.prepare("SELECT id FROM videos WHERE id = ?");
    const existing = checkStmt.get(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "视频不存在" },
        { status: 404 },
      );
    }

    // 记录操作前的数据（自动备份）
    recordOperation("videos", "update", id);

    // 更新视频（支持修改标题和审核状态）
    const stmt = db.prepare(
      `UPDATE videos
       SET title = COALESCE(?, title),
           status = COALESCE(?, status),
           updated_at = ?
       WHERE id = ?`,
    );

    stmt.run(updateData.title, updateData.status, now, id);

    // 获取更新后的视频
    const getStmt = db.prepare("SELECT * FROM videos WHERE id = ?");
    const video = getStmt.get(id);

    return NextResponse.json({
      success: true,
      video: { ...(video as any), key: (video as any).id },
    });
  } catch (error) {
    console.error("Failed to update video:", error);
    return NextResponse.json(
      { success: false, error: "更新视频失败" },
      { status: 400 },
    );
  }
}

// DELETE - 删除视频
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少视频 ID" },
        { status: 400 },
      );
    }

    // 检查视频是否存在
    const checkStmt = db.prepare("SELECT id FROM videos WHERE id = ?");
    const existing = checkStmt.get(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "视频不存在" },
        { status: 404 },
      );
    }

    // 记录操作前的数据（自动备份）
    recordOperation("videos", "delete", id);

    // 删除视频
    const stmt = db.prepare("DELETE FROM videos WHERE id = ?");
    stmt.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete video:", error);
    return NextResponse.json(
      { success: false, error: "删除视频失败" },
      { status: 400 },
    );
  }
}
