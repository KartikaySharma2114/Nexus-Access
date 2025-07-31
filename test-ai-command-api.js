/**
 * Test script to verify AI Command API endpoint is working correctly
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/ai-command`;

console.log('Testing AI Command API Endpoint...\n');

// Test cases
const testCases = [
  {
    name: 'Create Permission Command',
    command: 'Create a new permission called test_read_users',
    expectedType: 'create_permission'
  },
  {
    name: 'Create Role Command',
    command: 'Create a new role called test_editor',
    expectedType: 'create_role'
  },
  {
    name: 'Assign Permission Command',
    command: 'Give the admin role the read_users permission',
    expectedType: 'assign_permission'
  },
  {
    name: 'Remove Permission Command',
    command: 'Remove read_users permission from admin role',
    expectedType: 'remove_permission'
  },
  {
    name: 'Delete Permission Command',
    command: 'Delete the test_permission permission',
    expectedType: 'delete_permission'
  },
  {
    name: 'Delete Role Command',
    command: 'Delete the test_role role',
    expectedType: 'delete_role'
  },
  {
    name: 'Invalid Command',
    command: 'This is not a valid RBAC command',
    expectedType: 'unknown'
  },
  {
    name: 'Empty Command',
    command: '',
    expectError: true
  }
];

async function testAICommandAPI() {
  console.log('1. Checking if server is running...');
  
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/ai-service/availability`);
    if (!healthCheck.ok) {
      throw new Error(`Server not responding: ${healthCheck.status}`);
    }
    console.log('   ✓ Server is running');
    
    const availabilityData = await healthCheck.json();
    if (!availabilityData.available) {
      console.log('   ⚠ AI service is not available (missing API key)');
      console.log('   This is expected if GOOGLE_GEMINI_API_KEY is not set');
    } else {
      console.log('   ✓ AI service is available');
    }
  } catch (error) {
    console.log('   ✗ Server is not running or not accessible');
    console.log('   Please run "npm run dev" in another terminal first');
    process.exit(1);
  }

  console.log('\n2. Testing AI Command API endpoint...\n');

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Command: "${testCase.command}"`);
    
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: testCase.command
        })
      });

      const data = await response.json();
      
      // Check response structure
      if (testCase.expectError) {
        if (!response.ok && !data.success) {
          console.log('   ✓ Correctly rejected invalid input');
        } else {
          console.log('   ✗ Should have rejected invalid input');
        }
      } else {
        // Check if response has expected structure
        const hasRequiredFields = 
          typeof data.success === 'boolean' &&
          typeof data.message === 'string' &&
          (data.parsedCommand === null || typeof data.parsedCommand === 'object');

        if (hasRequiredFields) {
          console.log('   ✓ Response has correct structure');
          
          if (data.success && data.parsedCommand) {
            console.log(`   ✓ Parsed command type: ${data.parsedCommand.type}`);
            console.log(`   ✓ Message: ${data.message}`);
            
            if (testCase.expectedType && data.parsedCommand.type === testCase.expectedType) {
              console.log('   ✓ Command type matches expected');
            } else if (testCase.expectedType) {
              console.log(`   ⚠ Expected ${testCase.expectedType}, got ${data.parsedCommand.type}`);
            }
          } else if (!data.success) {
            console.log(`   ⚠ Command processing failed: ${data.message}`);
            if (data.error) {
              console.log(`   ⚠ Error: ${data.error}`);
            }
          }
        } else {
          console.log('   ✗ Response structure is incorrect');
          console.log('   Response:', JSON.stringify(data, null, 2));
        }
      }
    } catch (error) {
      console.log(`   ✗ Request failed: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('✅ AI Command API testing complete!\n');
  
  console.log('Summary:');
  console.log('- The API endpoint accepts natural language commands');
  console.log('- Commands are processed through the AI service');
  console.log('- Parsed commands are executed against the database');
  console.log('- Structured responses are returned with success/error status');
  console.log('\nTo test with real database operations:');
  console.log('1. Ensure you have valid Supabase credentials');
  console.log('2. Set up the GOOGLE_GEMINI_API_KEY environment variable');
  console.log('3. Use the natural language interface in the web application');
}

// Run the test
testAICommandAPI().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});