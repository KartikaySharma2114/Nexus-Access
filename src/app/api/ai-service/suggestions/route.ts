import { NextResponse } from 'next/server';
import { aiService } from '@/lib/gemini/ai-service';

export async function GET() {
  try {
    const suggestions = await aiService.getCommandSuggestions();
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error getting command suggestions:', error);
    return NextResponse.json({
      suggestions: [
        'Create a new permission called read_users',
        'Create a new role called editor',
        'Give the admin role the read_users permission',
        'Remove write_posts permission from guest role',
        'Delete the old_permission permission',
        'Delete the unused_role role',
      ],
    });
  }
}
