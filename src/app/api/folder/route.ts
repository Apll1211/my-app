import { type NextRequest, NextResponse } from "next/server";
import { db, generateId, getCurrentTime } from "@/lib/db";
import fs from "fs";
import path from "path";

// 指定使用 Node.js runtime（better-sqlite3 + fs 需要）
export const runtime = "nodejs";

// 支持的视频格式
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"];

// 检查文件是否为视频
function isVideoFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

// 递归扫描文件夹中的视频文件
function scanVideoFiles(dir: string, basePath: string = ""): string[] {
  const videoFiles: string[] = [];

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // 递归扫描子文件夹
        const subPath = basePath ? path.join(basePath, file) : file;
        videoFiles.push(...scanVideoFiles(fullPath, subPath));
      } else if (isVideoFile(file)) {
        // 添加视频文件
        const relativePath = basePath ? path.join(basePath, file) : file;
        videoFiles.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }

  return videoFiles;
}

// GET - 获取文件夹中的视频列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folderPath = searchParams.get("path");

    if (!folderPath) {
      return NextResponse.json(
        { success: false, error: "缺少文件夹路径" },
        { status: 400 }
      );
    }

    // 检查文件夹是否存在
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json(
        { success: false, error: "文件夹不存在" },
        { status: 404 }
      );
    }

    // 扫描视频文件
    const videoFiles = scanVideoFiles(folderPath);

    return NextResponse.json({
      success: true,
      videos: videoFiles.map((file) => ({
        filename: path.basename(file),
        path: file,
        fullPath: path.join(folderPath, file),
      })),
      count: videoFiles.length,
    });
  } catch (error) {
    console.error("Failed to scan folder:", error);
    return NextResponse.json(
      { success: false, error: "扫描文件夹失败" },
      { status: 500 }
    );
  }
}

// POST - 导入视频到数据库
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folderPath, videos } = body;

    if (!folderPath || !videos || !Array.isArray(videos)) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const now = getCurrentTime();
    const importedVideos: any[] = [];

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 准备插入语句
    const insertStmt = db.prepare(
      `INSERT INTO videos (id, title, author, description, video_url, duration, status, file_path, folder_path, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // 批量插入视频
    for (const video of videos) {
      try {
        const id = generateId();
        const filename = path.basename(video.path);
        const fullPath = path.join(folderPath, video.path);

        // 检查文件是否存在
        if (!fs.existsSync(fullPath)) {
          console.warn(`File not found: ${fullPath}`);
          continue;
        }

        // 生成唯一文件名
        const fileExt = path.extname(filename);
        const uniqueFileName = `${id}${fileExt}`;
        const destPath = path.join(uploadDir, uniqueFileName);

        // 复制文件到 uploads 目录
        fs.copyFileSync(fullPath, destPath);

        const videoData = {
          id,
          title: filename.replace(/\.[^/.]+$/, ""), 
          author: "本地视频",
          description: "",
          video_url: `/uploads/${uniqueFileName}`,
          duration: "未知",
          status: "已发布",
          file_path: video.path,
          folder_path: folderPath,
          created_at: now,
          updated_at: now,
        };

        insertStmt.run(
          videoData.id,
          videoData.title,
          videoData.author,
          videoData.description,
          videoData.video_url,
          videoData.duration,
          videoData.status,
          videoData.file_path,
          videoData.folder_path,
          videoData.created_at,
          videoData.updated_at
        );

        importedVideos.push(videoData);
      } catch (error) {
        console.error(`Failed to import video ${video.path}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedVideos.length,
      videos: importedVideos,
    });
  } catch (error) {
    console.error("Failed to import videos:", error);
    return NextResponse.json(
      { success: false, error: "导入视频失败" },
      { status: 500 }
    );
  }
}
