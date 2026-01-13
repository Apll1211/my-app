import { NextResponse } from "next/server";

// 演示 ky 组件的使用方式
// 这个文件展示了如何在前端使用 ky 调用后端 API

export async function GET() {
  const demoCode = `
// 前端使用 ky 调用 API 的示例

import ky from 'ky';

// 1. 获取文章列表
const articles = await ky.get('/api/articles').json();

// 2. 搜索文章
const searchResults = await ky.get('/api/search?q=react').json();

// 3. 获取分类
const categories = await ky.get('/api/categories').json();

// 4. 获取单篇文章
const article = await ky.get('/api/articles/my-first-post').json();

// 5. 创建文章（管理员）
const newArticle = await ky.post('/api/admin/articles', {
  json: {
    title: "我的新文章",
    content: "文章内容...",
    category: "tech",
    tags: "react,typescript",
    status: "published"
  }
}).json();

// 6. 上传图片
const formData = new FormData();
formData.append('file', imageFile);
const uploadResult = await ky.post('/api/upload', {
  body: formData
}).json();

// 7. 获取设置
const settings = await ky.get('/api/settings').json();
`;

  return NextResponse.json({
    success: true,
    message: "ky 组件使用示例",
    example: demoCode,
    api_endpoints: {
      articles: {
        GET: "/api/articles - 获取文章列表",
        POST: "/api/admin/articles - 创建文章",
      },
      article: {
        GET: "/api/articles/[slug] - 获取文章详情",
      },
      search: {
        GET: "/api/search?q=keyword - 搜索文章",
      },
      categories: {
        GET: "/api/categories - 获取分类",
      },
      upload: {
        POST: "/api/upload - 上传图片",
      },
    },
  });
}