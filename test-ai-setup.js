/**
 * Test script to verify AI setup is working correctly
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Test environment variables
console.log('Testing AI Setup...\n');

// Check if required environment variables are set
const requiredEnvVars = [
  'GOOGLE_GEMINI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

console.log('1. Checking environment variables:');
let envVarsOk = true;
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  const status = value ? '✓' : '✗';
  const displayValue = value
    ? varName.includes('KEY')
      ? '[HIDDEN]'
      : value
    : 'NOT SET';
  console.log(`   ${status} ${varName}: ${displayValue}`);
  if (!value) envVarsOk = false;
});

if (!envVarsOk) {
  console.log('\n❌ Some required environment variables are missing!');
  console.log('Please check your .env.local file.');
  process.exit(1);
}

// Test Google Generative AI import
console.log('\n2. Testing Google Generative AI import:');
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  console.log('   ✓ @google/generative-ai package imported successfully');

  // Test API initialization
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  console.log('   ✓ GoogleGenerativeAI client initialized');

  // Test model creation
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('   ✓ Gemini model instance created');
} catch (error) {
  console.log('   ✗ Error with Google Generative AI:', error.message);
  process.exit(1);
}

// Test file structure
console.log('\n3. Checking AI service files:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/lib/gemini/config.ts',
  'src/lib/gemini/types.ts',
  'src/lib/gemini/context-manager.ts',
  'src/lib/gemini/command-parser.ts',
  'src/lib/gemini/error-handler.ts',
  'src/lib/gemini/ai-service.ts',
  'src/lib/gemini/index.ts',
];

requiredFiles.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✓' : '✗';
  console.log(`   ${status} ${filePath}`);
});

console.log('\n✅ AI Setup verification complete!');
console.log('\nNext steps:');
console.log('1. Run "npm run dev" to start the development server');
console.log(
  '2. Test the AI functionality through the natural language interface'
);
console.log('3. Check the browser console for any runtime errors');
