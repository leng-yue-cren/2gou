import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const ratelimitKey = `ratelimit:like:${slug}:${ip}`;
  
  const hasLiked = await kv.get(ratelimitKey);
  if (hasLiked) return NextResponse.json({ reason: 'rate_limited' }, { status: 429 });

  const key = `likes:${slug}`;
  const newCount = await kv.incr(key);
  await kv.set(ratelimitKey, true, { ex: 86400 });

  return NextResponse.json({ count: newCount });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ count: 0 });
  const count = await kv.get(`likes:${slug}`);
  return NextResponse.json({ count: Number(count) || 0 });
}