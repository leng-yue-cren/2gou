import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const ratelimitKey = `ratelimit:like:${slug}:${ip}`;
  
  // --- 核心修改：允许点 5 次 ---
  const currentCount = await kv.get<number>(ratelimitKey) || 0;
  const MAX_LIKES_PER_DAY = 5; // 这里设置每天允许点赞的次数

  if (currentCount >= MAX_LIKES_PER_DAY) {
    return NextResponse.json({ reason: 'rate_limited' }, { status: 429 });
  }

  const key = `likes:${slug}`;
  const newCount = await kv.incr(key);
  
  // 增加该用户今天的点赞计数，并设置 24 小时过期
  await kv.incr(ratelimitKey);
  await kv.expire(ratelimitKey, 86400); 

  return NextResponse.json({ count: newCount });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ count: 0 });
  const count = await kv.get(`likes:${slug}`);
  return NextResponse.json({ count: Number(count) || 0 });
}