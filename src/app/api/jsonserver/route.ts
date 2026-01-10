import { NextRequest, NextResponse } from "next/server";

// 默认 JSON Server URL
const DEFAULT_JSON_SERVER_URL = "http://localhost:3001";

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 10000;

// 从请求中获取 JSON Server URL
function getJsonServerUrl(request: NextRequest): string {
  // 1. 从查询参数中获取
  const urlParam = request.nextUrl.searchParams.get("url");
  if (urlParam) {
    return urlParam;
  }
  
  // 2. 从环境变量中获取
  if (process.env.JSON_SERVER_URL) {
    return process.env.JSON_SERVER_URL;
  }
  
  // 3. 使用默认值
  return DEFAULT_JSON_SERVER_URL;
}

// 健康检查端点
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const healthCheck = searchParams.get("health");

    // 健康检查
    if (healthCheck === "true") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        
        const jsonServerUrl = getJsonServerUrl(request);
        const response = await fetch(jsonServerUrl, {
          method: "GET",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return NextResponse.json({
            status: "healthy",
            url: jsonServerUrl,
            timestamp: new Date().toISOString(),
          });
        } else {
          return NextResponse.json(
            {
              status: "unhealthy",
              url: jsonServerUrl,
              error: `Server returned status ${response.status}`,
            },
            { status: 503 }
          );
        }
      } catch (error) {
        const jsonServerUrl = getJsonServerUrl(request);
        return NextResponse.json(
          {
            status: "unhealthy",
            url: jsonServerUrl,
            error: error instanceof Error ? error.message : "Connection failed",
          },
          { status: 503 }
        );
      }
    }

    // 获取所有可用的资源列表
    if (!resource) {
      const jsonServerUrl = getJsonServerUrl(request);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      try {
        // 尝试 1: 直接访问根路径获取完整数据库结构
        const response = await fetch(jsonServerUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
          },
        });
        
        clearTimeout(timeoutId);
        
        // 检查响应内容类型
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          // 成功获取 JSON 响应
          if (!response.ok) {
            return NextResponse.json(
              {
                error: `JSON Server returned status ${response.status}`,
                status: response.status,
                url: jsonServerUrl,
              },
              { status: response.status }
            );
          }
          
          let data: any;
          try {
            const text = await response.text();
            data = JSON.parse(text);
          } catch (parseError) {
            return NextResponse.json(
              {
                error: "Invalid JSON response from JSON Server",
                details: parseError instanceof Error ? parseError.message : "Unknown parse error",
                url: jsonServerUrl,
              },
              { status: 500 }
            );
          }
          
          // 如果返回的是对象，提取键名作为资源列表
          if (typeof data === "object" && data !== null && !Array.isArray(data)) {
            const resources = Object.keys(data);
            return NextResponse.json({
              resources,
              message: `Found ${resources.length} resources`,
              details: resources.map(r => ({
                name: r,
                count: Array.isArray(data[r]) ? data[r].length : 1
              }))
            });
          }
          
          // 如果返回的是数组，直接返回
          if (Array.isArray(data)) {
            return NextResponse.json({
              resources: ["root"],
              message: "Root is an array, using 'root' as resource name",
            });
          }
        }
        
        // 尝试 2: 如果根路径返回 HTML，尝试常见资源名称并验证哪些存在
        const commonResources = [
          "adminMenus", "users", "videos", "menus",  // 用户指定的资源
          "posts", "comments", "products", "categories",
          "images", "files", "items", "data",
          "records", "entries", "lists", "tables"
        ];
        const availableResources: string[] = [];
        const failedResources: string[] = [];
        
        console.log(`[JSON Server] Starting resource probing for ${jsonServerUrl}`);
        
        for (const resourceName of commonResources) {
          try {
            const checkController = new AbortController();
            const checkTimeoutId = setTimeout(() => checkController.abort(), 3000); // 3 秒超时
            
            const checkResponse = await fetch(`${jsonServerUrl}/${resourceName}?_limit=1`, {
              method: "GET",
              signal: checkController.signal,
            });
            
            clearTimeout(checkTimeoutId);
            
            if (checkResponse.ok) {
              console.log(`[JSON Server] Found resource: ${resourceName}`);
              availableResources.push(resourceName);
            } else {
              console.log(`[JSON Server] Resource not found (status ${checkResponse.status}): ${resourceName}`);
              failedResources.push(resourceName);
            }
          } catch (error) {
            console.log(`[JSON Server] Failed to probe resource: ${resourceName}`, error);
            failedResources.push(resourceName);
          }
        }
        
        console.log(`[JSON Server] Probe complete. Found: ${availableResources.length}, Failed: ${failedResources.length}`);
        
        if (availableResources.length > 0) {
          return NextResponse.json({
            resources: availableResources,
            message: `Discovered ${availableResources.length} available resources by probing`,
            method: "probe",
            failed: failedResources,
          });
        }
        
        // 如果所有尝试都失败，返回错误
        return NextResponse.json({
          error: "Unable to discover resources",
          message: "Could not auto-discover resources from JSON Server",
          suggestion: "Please check your JSON Server configuration or manually specify resource names",
          url: jsonServerUrl,
        }, { status: 500 });
        
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }

    // 构建完整的 URL，包括所有查询参数
    const queryString = request.url.split("?")[1];
    const jsonServerUrl = getJsonServerUrl(request);
    let url = `${jsonServerUrl}/${resource}`;
    
    // 保留除 resource 参数外的所有查询参数
    if (queryString) {
      const params = new URLSearchParams(queryString);
      params.delete("resource");
      const paramString = params.toString();
      if (paramString) {
        url += `?${paramString}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // 尝试获取错误详情
        let errorDetails: any = {};
        try {
          const text = await response.text();
          if (text) {
            try {
              errorDetails = JSON.parse(text);
            } catch {
              errorDetails = { message: text };
            }
          }
        } catch {
          // 忽略解析错误
        }
        
        return NextResponse.json(
          {
            error: `JSON Server returned status ${response.status}`,
            status: response.status,
            resource,
            url,
            details: errorDetails,
          },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error("JSON Server GET error:", error);
    const jsonServerUrl = getJsonServerUrl(request);
    
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - JSON Server did not respond in time" },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to fetch from JSON Server",
        details: error instanceof Error ? error.message : "Unknown error",
        url: jsonServerUrl,
      },
      { status: 500 }
    );
  }
}

// 创建新记录
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");

    if (!resource) {
      return NextResponse.json(
        { error: "Resource parameter is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const jsonServerUrl = getJsonServerUrl(request);
    const url = `${jsonServerUrl}/${resource}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json(
          {
            error: "Failed to create record",
            details: data,
          },
          { status: response.status }
        );
      }
      
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error("JSON Server POST error:", error);
    const jsonServerUrl = getJsonServerUrl(request);
    
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - JSON Server did not respond in time" },
        { status: 504 }
      );
    }
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to create record",
        details: error instanceof Error ? error.message : "Unknown error",
        url: jsonServerUrl,
      },
      { status: 500 }
    );
  }
}

// 更新记录（完整替换）
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const id = searchParams.get("id");

    if (!resource || !id) {
      return NextResponse.json(
        { error: "Resource and id parameters are required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const jsonServerUrl = getJsonServerUrl(request);
    const url = `${jsonServerUrl}/${resource}/${id}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json(
          {
            error: "Failed to update record",
            details: data,
          },
          { status: response.status }
        );
      }
      
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error("JSON Server PUT error:", error);
    const jsonServerUrl = getJsonServerUrl(request);
    
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - JSON Server did not respond in time" },
        { status: 504 }
      );
    }
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to update record",
        details: error instanceof Error ? error.message : "Unknown error",
        url: jsonServerUrl,
      },
      { status: 500 }
    );
  }
}

// 部分更新记录
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const id = searchParams.get("id");

    if (!resource || !id) {
      return NextResponse.json(
        { error: "Resource and id parameters are required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const jsonServerUrl = getJsonServerUrl(request);
    const url = `${jsonServerUrl}/${resource}/${id}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        return NextResponse.json(
          {
            error: "Failed to patch record",
            details: data,
          },
          { status: response.status }
        );
      }
      
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error("JSON Server PATCH error:", error);
    const jsonServerUrl = getJsonServerUrl(request);
    
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - JSON Server did not respond in time" },
        { status: 504 }
      );
    }
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to patch record",
        details: error instanceof Error ? error.message : "Unknown error",
        url: jsonServerUrl,
      },
      { status: 500 }
    );
  }
}

// 删除记录
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const id = searchParams.get("id");

    if (!resource || !id) {
      return NextResponse.json(
        { error: "Resource and id parameters are required" },
        { status: 400 }
      );
    }

    const jsonServerUrl = getJsonServerUrl(request);
    const url = `${jsonServerUrl}/${resource}/${id}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        method: "DELETE",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch {
          data = { message: response.statusText };
        }
        return NextResponse.json(
          {
            error: "Failed to delete record",
            details: data,
          },
          { status: response.status }
        );
      }
      
      // DELETE 可能返回空响应
      const text = await response.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          return NextResponse.json(data, { status: response.status });
        } catch {
          return NextResponse.json({ success: true }, { status: response.status });
        }
      }
      
      return NextResponse.json({ success: true }, { status: response.status });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error("JSON Server DELETE error:", error);
    const jsonServerUrl = getJsonServerUrl(request);
    
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - JSON Server did not respond in time" },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to delete record",
        details: error instanceof Error ? error.message : "Unknown error",
        url: jsonServerUrl,
      },
      { status: 500 }
    );
  }
}