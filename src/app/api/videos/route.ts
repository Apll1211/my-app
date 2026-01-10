import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import fs from "fs";
import { type NextRequest, NextResponse } from "next/server";
import path from "path";
import { db, generateId, getCurrentTime } from "@/lib/db";

// 指定使用 Node.js runtime（better-sqlite3 需要）
export const runtime = "nodejs";

// 获取视频时长（使用 ffmpeg.wasm）
async function getVideoDuration(filePath: string): Promise<string> {
  try {
    const ffmpeg = new FFmpeg();
    
    // 加载 FFmpeg 核心文件
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });
    
    // 读取视频文件
    const videoData = await fetchFile(filePath);
    await ffmpeg.writeFile("input.mp4", videoData);
    
    // 获取视频信息并输出到日志
    await ffmpeg.exec(["-i", "input.mp4", "-f", "null", "-"]);
    
    // 获取日志
    const logs = await ffmpeg.readFile("ffmpeg-0.log");
    const logText = new TextDecoder().decode(logs as Uint8Array);
    
    // 从日志中提取时长
    const durationMatch = logText.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseInt(durationMatch[3]);
      
      // 格式化为 MM:SS
      const totalMinutes = hours * 60 + minutes;
      const formattedMinutes = totalMinutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');
      
      return `${formattedMinutes}:${formattedSeconds}`;
    }
    
    // 清理临时文件
    await ffmpeg.deleteFile("input.mp4");
    
    // 如果无法提取时长，返回默认值
    return "00:00";
  } catch (error) {
    console.error("Failed to get video duration:", error);
    return "00:00"; // 默认值
  }
}

// 生成视频缩略图（使用 ffmpeg.wasm）
async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  width: number = 320,
  height: number = 180,
): Promise<void> {
  try {
    const ffmpeg = new FFmpeg();

    // 加载 FFmpeg 核心文件
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });

    // 读取视频文件
    const videoData = await fetchFile(inputPath);
    await ffmpeg.writeFile("input.mp4", videoData);

    // 生成缩略图
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-ss",
      "00:00:01",
      "-vframes",
      "1",
      "-vf",
      `scale=${width}:${height}`,
      "-q:v",
      "2",
      "output.jpg",
    ]);

    // 读取生成的缩略图
    const thumbnailData = await ffmpeg.readFile("output.jpg");

    // 将缩略图写入文件系统
    fs.writeFileSync(outputPath, thumbnailData);

    // 清理临时文件
    await ffmpeg.deleteFile("input.mp4");
    await ffmpeg.deleteFile("output.jpg");
  } catch (error) {
    console.error("Failed to generate thumbnail:", error);
    throw error;
  }
}

// POST - 创建视频（投稿）
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string;

    // 验证必填字段
    if (!file || !title || !author) {
      return NextResponse.json(
        { error: "缺少必填字段：file, title, author" },
        { status: 400 },
      );
    }

    // 验证文件类型
    const allowedTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
    }

    // 验证文件大小（100MB）
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "文件大小超过限制，最大支持 100MB" },
        { status: 400 },
      );
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const fileExt = path.extname(file.name);
    const fileName = `${generateId()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // 保存文件
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // 获取视频时长
    const duration = await getVideoDuration(filePath);

    // 生成缩略图
    let thumbnail = "";
    try {
      const thumbnailFileName = `${generateId()}_thumbnail.jpg`;
      const thumbnailPath = path.join(uploadDir, thumbnailFileName);
      await generateThumbnail(filePath, thumbnailPath);
      thumbnail = `/uploads/${thumbnailFileName}`;
    } catch (error) {
      console.error("生成缩略图失败:", error);
      // 缩略图生成失败不影响视频上传
    }

    // 生成视频 ID
    const id = generateId();
    const now = getCurrentTime();
    const video_url = `/uploads/${fileName}`;

    // 插入视频记录（状态默认为"待审核"）
    const stmt = db.prepare(`
      INSERT INTO videos (
        id, title, author, description, thumbnail, video_url, duration,
        likes, comments, shares, views, status, file_path, folder_path, tags,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, '待审核', ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      title,
      author,
      description || "",
      thumbnail,
      video_url,
      duration,
      filePath,
      "",
      tags || "",
      now,
      now,
    );

    return NextResponse.json({
      success: true,
      video: {
        id,
        title,
        author,
        description,
        video_url,
        duration,
        tags,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Failed to create video:", error);
    return NextResponse.json(
      { error: "创建视频失败", details: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
 
    // 计算分页
    const offset = (page - 1) * limit;
 
    // 获取总记录数（查询所有视频，不限制状态）
    const countStmt = db.prepare("SELECT COUNT(*) as total FROM videos");
    const countResult: any = countStmt.get();
    const total = countResult.total;
 
    // 获取分页数据（返回所有视频），关联用户信息
    const stmt = db.prepare(`
      SELECT
        v.*,
        u.id as user_id,
        u.username as user_username,
        u.nickname as user_nickname,
        u.avatar as user_avatar,
        u.bio as user_bio
      FROM videos v
      LEFT JOIN users u ON v.author_id = u.id
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const videos = stmt.all(limit, offset);
 
    return NextResponse.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return NextResponse.json(
      { error: "获取视频列表失败", details: String(error) },
      { status: 500 },
    );
  }
}
