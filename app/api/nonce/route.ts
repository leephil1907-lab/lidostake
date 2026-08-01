import { NextResponse } from 'next/server';

export async function GET() {
  const nonce = Math.floor(Math.random() * 1000000000).toString();
  return NextResponse.json({ nonce });
}
