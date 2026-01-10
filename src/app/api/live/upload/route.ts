import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "请选择M3U文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.name.endsWith(".m3u") && !file.name.endsWith(".m3u8")) {
      return NextResponse.json(
        { error: "请上传.m3u或.m3u8格式的文件" },
        { status: 400 }
      );
    }

    // 读取文件内容
    const content = await file.text();

    // 验证是否为有效的M3U文件
    if (!content.trim().startsWith("#EXTM3U")) {
      return NextResponse.json(
        { error: "无效的M3U文件格式" },
        { status: 400 }
      );
    }

    // 确保public/uploads目录存在
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // 保存文件
    const fileName = `playlist.m3u`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, content, "utf-8");

    return NextResponse.json({
      success: true,
      url: `/uploads/${fileName}`,
      message: "M3U文件上传成功",
    });
  } catch (error) {
    console.error("Failed to upload M3U file:", error);
    return NextResponse.json(
      { error: "上传失败，请检查文件格式" },
      { status: 500 }
    );
  }
}