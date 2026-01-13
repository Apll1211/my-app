import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 从数据库获取 sidebar 配置
    const items = db.prepare('SELECT * FROM sidebar_items WHERE active = 1 ORDER BY sort_order').all();
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch sidebar items:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}