import { NextResponse } from 'next/server';
import { aiService } from '@/lib/gemini/ai-service';

export async function GET() {
  try {
    const helpText = aiService.getHelpText();
    return NextResponse.json({ helpText });
  } catch (error) {
    console.error('Error getting help text:', error);
    return NextResponse.json({
      helpText: `Natural Language Commands Help:

CREATING ITEMS:
• "Create a new permission called [name]"
• "Add permission [name] with description [description]"
• "Create a new role called [name]"
• "Add role [name]"

MANAGING ASSOCIATIONS:
• "Give [role_name] the [permission_name] permission"
• "Assign [permission_name] to [role_name]"
• "Remove [permission_name] from [role_name]"
• "Take away [permission_name] permission from [role_name]"

DELETING ITEMS:
• "Delete the [permission_name] permission"
• "Remove permission [permission_name]"
• "Delete the [role_name] role"
• "Remove role [role_name]"

TIPS:
• Use exact names as they appear in your system
• Be specific about what you want to do
• You can use natural variations of these commands
• If a command fails, try rephrasing it`,
    });
  }
}
