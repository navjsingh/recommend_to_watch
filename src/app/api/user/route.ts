import { NextRequest, NextResponse } from 'next/server';

// In-memory user store for demo (replace with DB later)
let userProfile: any = null;

export async function GET() {
  if (!userProfile) {
    return NextResponse.json({ error: 'No user profile found' }, { status: 404 });
  }
  return NextResponse.json(userProfile);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  userProfile = { ...data };
  return NextResponse.json(userProfile, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  userProfile = { ...userProfile, ...data };
  return NextResponse.json(userProfile);
} 