import { type NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// POST - 图片上传
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

    // 验证文件类型（只允许图片）
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "不支持的文件类型，只允许图片文件" },
        { status: 400 }
      );
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "文件大小超过限制（最大10MB）" },
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

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "文件上传失败" },
      { status: 500 }
    );
  }
}