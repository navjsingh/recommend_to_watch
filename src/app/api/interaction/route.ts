import { NextRequest, NextResponse } from 'next/server';

// In-memory store: { [userId]: { [movieId]: { liked: boolean, watched: boolean } } }
const userInteractions: Record<string, Record<string, { liked: boolean; watched: boolean }>> = {};

export async function POST(req: NextRequest) {
  const { userId, movieId, liked, watched } = await req.json();
  if (!userInteractions[userId]) userInteractions[userId] = {};
  userInteractions[userId][movieId] = { liked, watched };
  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const movieId = searchParams.get('movieId');
  const all = searchParams.get('all');
  if (!userId) return NextResponse.json({});
  if (all === 'true') {
    return NextResponse.json(userInteractions[userId] || {});
  }
  if (!movieId) return NextResponse.json({ liked: false, watched: false });
  const state = userInteractions[userId]?.[movieId] || { liked: false, watched: false };
  return NextResponse.json(state);
} 