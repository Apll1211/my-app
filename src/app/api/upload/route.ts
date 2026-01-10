import { type NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// 生成视频缩略图（使用 ffmpeg.wasm）
async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  width: number = 320,
  height: number = 180
): Promise<void> {
  try {
    const ffmpeg = new FFmpeg();
    
    // 加载 FFmpeg 核心文件
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
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

// POST - 文件上传
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "没有上传文件" },
        { status: 400 }
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
      return NextResponse.json(
        { success: false, error: "不支持的文件类型" },
        { status: 400 }
      );
    }

    // 验证文件大小（100MB）
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "文件大小超过限制" },
        { status: 400 }
      );
    }

    // 保存文件到本地
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileName = `${timestamp}-${randomStr}${path.extname(file.name)}`;
    const filePath = path.join(uploadsDir, fileName);

    // 将文件写入磁盘
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    // 生成缩略图
    let thumbnailUrl = "";
    try {
      const thumbnailFileName = `${timestamp}-${randomStr}_thumbnail.jpg`;
      const thumbnailPath = path.join(uploadsDir, thumbnailFileName);
      
      await generateThumbnail(filePath, thumbnailPath);
      thumbnailUrl = `/uploads/${thumbnailFileName}`;
    } catch (error) {
      console.error("生成缩略图失败:", error);
      // 缩略图生成失败不影响视频上传
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      thumbnailUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("文件上传失败:", error);
    return NextResponse.json(
      { success: false, error: "文件上传失败" },
      { status: 500 }
    );
  }
}