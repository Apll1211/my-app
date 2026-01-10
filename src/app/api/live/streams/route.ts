import { NextResponse } from "next/server";
import { db, generateId, getCurrentTime } from "@/lib/db";

// GET - 获取所有直播源
export async function GET() {
  try {
    const streams = db
      .prepare(`
        SELECT * FROM live_streams
        WHERE active = 1
        ORDER BY group_title, name
      `)
      .all();

    return NextResponse.json({ streams });
  } catch (error) {
    console.error("Error fetching live streams:", error);
    return NextResponse.json(
      { error: "Failed to fetch live streams" },
      { status: 500 }
    );
  }
}

// POST - 刷新直播源（从外部M3U获取）或添加单个直播源
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 如果有body，说明是添加单个直播源
    if (body && body.name && body.url) {
      const now = getCurrentTime();
      const id = generateId();
      
      db.prepare(`
        INSERT INTO live_streams (id, name, url, group_title, tvg_id, tvg_name, tvg_logo, logo, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        id,
        body.name,
        body.url,
        body.group_title || "其他",
        body.tvg_id || null,
        body.tvg_name || null,
        body.tvg_logo || null,
        body.logo || null,
        now,
        now
      );
      
      return NextResponse.json({
        success: true,
        message: "添加成功",
      });
    }
    
    // 否则，从外部M3U获取（通过代理）
    const m3uUrl = "https://m.iill.top/Live.m3u";
    const proxyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/proxy/m3u?url=${encodeURIComponent(m3uUrl)}`;
    
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch M3U: ${response.statusText}`);
    }

    const m3uContent = await response.text();

    // 解析M3U内容
    const lines = m3uContent.split("\n");
    const newStreams: any[] = [];
    let currentStream: any = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("#EXTINF:")) {
        // 解析扩展信息
        const info = line.substring(8);
        const nameMatch = info.match(/,(.+)$/);
        const groupMatch = info.match(/group-title="([^"]+)"/);
        const tvgIdMatch = info.match(/tvg-id="([^"]+)"/);
        const tvgNameMatch = info.match(/tvg-name="([^"]+)"/);
        const tvgLogoMatch = info.match(/tvg-logo="([^"]+)"/);
        const logoMatch = info.match(/logo="([^"]+)"/);

        currentStream = {
          id: generateId(),
          name: nameMatch ? nameMatch[1].trim() : `频道 ${newStreams.length + 1}`,
          group_title: groupMatch ? groupMatch[1] : "其他",
          tvg_id: tvgIdMatch ? tvgIdMatch[1] : null,
          tvg_name: tvgNameMatch ? tvgNameMatch[1] : null,
          tvg_logo: tvgLogoMatch ? tvgLogoMatch[1] : null,
          logo: logoMatch ? logoMatch[1] : null,
        };
      } else if (line && !line.startsWith("#")) {
        // 这是直播流URL
        if (currentStream.name) {
          currentStream.url = line;
          newStreams.push(currentStream);
          currentStream = {};
        }
      }
    }

    // 使用事务更新数据库
    const now = getCurrentTime();
    const deleteStmt = db.prepare("DELETE FROM live_streams");
    const insertStmt = db.prepare(`
      INSERT INTO live_streams (id, name, url, group_title, tvg_id, tvg_name, tvg_logo, logo, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const insertMany = db.transaction((streams: any[]) => {
      deleteStmt.run();
      for (const stream of streams) {
        insertStmt.run(
          stream.id,
          stream.name,
          stream.url,
          stream.group_title || "其他",
          stream.tvg_id || null,
          stream.tvg_name || null,
          stream.tvg_logo || null,
          stream.logo || null,
          now,
          now
        );
      }
    });

    insertMany(newStreams);

    return NextResponse.json({
      success: true,
      message: `成功导入 ${newStreams.length} 个直播源`,
      count: newStreams.length,
    });
  } catch (error) {
    console.error("Error in POST live streams:", error);
    return NextResponse.json(
      { error: "Failed to process live streams" },
      { status: 500 }
    );
  }
}

// PUT - 更新直播源
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const now = getCurrentTime();
    const updates: string[] = [];
    const values: any[] = [];

    if (updateData.name !== undefined) {
      updates.push("name = ?");
      values.push(updateData.name);
    }
    if (updateData.url !== undefined) {
      updates.push("url = ?");
      values.push(updateData.url);
    }
    if (updateData.group_title !== undefined) {
      updates.push("group_title = ?");
      values.push(updateData.group_title);
    }
    if (updateData.logo !== undefined) {
      updates.push("logo = ?");
      values.push(updateData.logo);
    }
    if (updateData.tvg_id !== undefined) {
      updates.push("tvg_id = ?");
      values.push(updateData.tvg_id);
    }
    if (updateData.tvg_name !== undefined) {
      updates.push("tvg_name = ?");
      values.push(updateData.tvg_name);
    }
    if (updateData.tvg_logo !== undefined) {
      updates.push("tvg_logo = ?");
      values.push(updateData.tvg_logo);
    }
    if (updateData.active !== undefined) {
      updates.push("active = ?");
      values.push(updateData.active);
    }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    const sql = `
      UPDATE live_streams
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    db.prepare(sql).run(...values);

    return NextResponse.json({
      success: true,
      message: "更新成功",
    });
  } catch (error) {
    console.error("Error updating live stream:", error);
    return NextResponse.json(
      { error: "Failed to update live stream" },
      { status: 500 }
    );
  }
}

// DELETE - 删除直播源
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    db.prepare("DELETE FROM live_streams WHERE id = ?").run(id);

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("Error deleting live stream:", error);
    return NextResponse.json(
      { error: "Failed to delete live stream" },
      { status: 500 }
    );
  }
}