import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/gemini/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid command format',
          error: 'Command must be a non-empty string',
        },
        { status: 400 }
      );
    }

    const response = await aiService.processCommand(command);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing AI command:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process command',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestions: [
        'Try rephrasing your command',
        "Check if you're using correct permission or role names",
        'Use simpler language',
      ],
    });
  }
}
