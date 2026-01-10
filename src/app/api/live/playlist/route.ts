import { NextRequest, NextResponse } from "next/server";
import { readFile, access, constants } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", "playlist.m3u");

    // 检查文件是否存在
    try {
      await access(filePath, constants.F_OK);
    } catch {
      return NextResponse.json(
        { error: "未找到播放列表文件" },
        { status: 404 }
      );
    }

    // 读取文件内容
    const content = await readFile(filePath, "utf-8");

    return NextResponse.json({
      success: true,
      content,
      url: "/uploads/playlist.m3u",
    });
  } catch (error) {
    console.error("Failed to read playlist:", error);
    return NextResponse.json(
      { error: "读取播放列表失败" },
      { status: 500 }
    );
  }
}