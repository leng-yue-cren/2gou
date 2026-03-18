import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const ratelimitKey = `ratelimit:like:${slug}:${ip}`;
    
    // 1. 检查这个 IP 今天点了几次
    const currentCount = await kv.get<number>(ratelimitKey) || 0;
    
    // 🔥 这里设置上限（比如 5 次）
    if (currentCount >= 5) {
      return NextResponse.json({ reason: 'rate_limited' }, { status: 429 });
    }

    // 2. 增加总点赞数
    const key = `likes:${slug}`;
    const newCount = await kv.incr(key);
    
    // 3. 🔥 关键：增加该用户的计数，并设置 24 小时过期
    await kv.incr(ratelimitKey);
    await kv.expire(ratelimitKey, 86400); 

    return NextResponse.json({ count: newCount });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ count: 0 });
  const count = await kv.get(`likes:${slug}`);
  return NextResponse.json({ count: Number(count) || 0 });
}