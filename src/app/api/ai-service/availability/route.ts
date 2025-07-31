import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const isAvailable = Boolean(apiKey && apiKey.trim().length > 0);

    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking AI service availability:', error);
    return NextResponse.json({ available: false });
  }
}
