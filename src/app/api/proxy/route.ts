import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "缺少 URL 参数" }, { status: 400 });
  }

  try {
    console.log(`[Proxy] Fetching: ${url}`);
    
    // 转换 GitHub blob URL 为 raw URL
    let targetUrl = url;
    if (url.includes("github.com") && url.includes("/blob/")) {
      targetUrl = url.replace("/blob/", "/raw/");
      console.log(`[Proxy] Converted GitHub blob URL to raw URL`);
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
      },
    });

    if (!response.ok) {
      console.error(`[Proxy] Failed to fetch: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch: ${response.statusText}` },
        { status: response.status }
      );
    }

    // 获取内容类型
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    // 检查是否为 M3U 文件
    const isM3U = url.includes(".m3u8") || url.includes(".m3u");

    if (isM3U) {
      // 处理 M3U 文件
      const text = await response.text();
      
      // 检查返回的内容是否为有效的 M3U
      if (!text.includes("#EXTM3U") && !text.includes("#EXTINF")) {
        console.error("[Proxy] Invalid M3U content:", text.substring(0, 200));
        throw new Error("返回的不是有效的 M3U 文件");
      }

      console.log(`[Proxy] Successfully fetched M3U, length: ${text.length} bytes`);

      // 获取基础 URL 用于解析相对路径
      const baseUrl = new URL(targetUrl);

      // 关键：将 M3U 内的所有路径（绝对路径和相对路径）替换为本地代理链接
      // 匹配不以 # 开头的非空行
      const proxyText = text.replace(/^(?!#)(.+)$/gm, (match) => {
        const trimmedMatch = match.trim();
        if (!trimmedMatch) return match;
        
        // 如果已经是绝对路径（http/https），直接代理
        if (trimmedMatch.startsWith("http://") || trimmedMatch.startsWith("https://")) {
          return `/api/proxy?url=${encodeURIComponent(trimmedMatch)}`;
        }
        
        // 如果是相对路径，先转换为绝对路径
        try {
          const absoluteUrl = new URL(trimmedMatch, baseUrl).href;
          return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
        } catch (e) {
          console.error("[Proxy] Failed to resolve relative path:", trimmedMatch, e);
          return match;
        }
      });

      console.log(`[Proxy] Replaced all paths with proxy URLs`);

      // 返回 M3U 内容
      return new NextResponse(proxyText, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=300",
        },
      });
    } else {
      // 处理 TS 分片或其他文件
      const data = await response.arrayBuffer();
      
      console.log(`[Proxy] Successfully fetched ${data.byteLength} bytes, content-type: ${contentType}`);

      // 返回二进制数据，确保 TS 文件使用正确的 Content-Type
      return new NextResponse(data, {
        status: response.status,
        headers: {
          "Content-Type": url.includes(".ts") ? "video/mp2t" : contentType,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Range",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (error) {
    console.error("[Proxy] Error:", error);
    return NextResponse.json(
      { error: "代理请求失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}