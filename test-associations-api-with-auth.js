const BASE_URL = 'http://localhost:3000';

// Test credentials from the login form
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'password123';

async function authenticateUser() {
  console.log('🔐 Authenticating user...');

  const response = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  if (response.ok) {
    const cookies = response.headers.get('set-cookie');
    console.log('✅ Authentication successful');
    return cookies;
  } else {
    console.log('❌ Authentication failed, proceeding without auth');
    return null;
  }
}

async function testAssociationsAPI() {
  console.log('Testing Associations API with Authentication...\n');

  try {
    // Try to authenticate first
    const authCookies = await authenticateUser();
    const headers = {
      'Content-Type': 'application/json',
      ...(authCookies && { Cookie: authCookies }),
    };

    // Test GET associations
    console.log('1. Testing GET /api/associations');
    const getResponse = await fetch(`${BASE_URL}/api/associations`, {
      headers,
    });
    const getResult = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getResult, null, 2));

    if (getResponse.status === 200) {
      console.log('✅ GET associations successful\n');
    } else {
      console.log('❌ GET associations failed\n');
      return;
    }

    // Test GET roles and permissions to get IDs for testing
    console.log('2. Getting roles and permissions for testing');
    const rolesResponse = await fetch(`${BASE_URL}/api/roles`, { headers });
    const rolesResult = await rolesResponse.json();
    const permissionsResponse = await fetch(`${BASE_URL}/api/permissions`, {
      headers,
    });
    const permissionsResult = await permissionsResponse.json();

    if (rolesResult.data?.length > 0 && permissionsResult.data?.length > 0) {
      const testRole = rolesResult.data[0];
      const testPermission = permissionsResult.data[0];

      console.log('Test role:', testRole.name);
      console.log('Test permission:', testPermission.name);
      console.log('✅ Got test data\n');

      // Test POST association
      console.log('3. Testing POST /api/associations');
      const postResponse = await fetch(`${BASE_URL}/api/associations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          role_id: testRole.id,
          permission_id: testPermission.id,
        }),
      });
      const postResult = await postResponse.json();
      console.log('Status:', postResponse.status);
      console.log('Response:', JSON.stringify(postResult, null, 2));

      if (postResponse.status === 201 || postResponse.status === 409) {
        console.log('✅ POST association successful (or already exists)\n');

        // Test DELETE association
        console.log('4. Testing DELETE /api/associations');
        const deleteResponse = await fetch(
          `${BASE_URL}/api/associations?role_id=${testRole.id}&permission_id=${testPermission.id}`,
          { method: 'DELETE', headers }
        );
        const deleteResult = await deleteResponse.json();
        console.log('Status:', deleteResponse.status);
        console.log('Response:', JSON.stringify(deleteResult, null, 2));

        if (deleteResponse.status === 200) {
          console.log('✅ DELETE association successful\n');
        } else {
          console.log('❌ DELETE association failed\n');
        }

        // Test bulk operations
        console.log('5. Testing POST /api/associations/bulk (assign)');
        const bulkAssignResponse = await fetch(
          `${BASE_URL}/api/associations/bulk`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              role_id: testRole.id,
              permission_ids: [testPermission.id],
              operation: 'assign',
            }),
          }
        );
        const bulkAssignResult = await bulkAssignResponse.json();
        console.log('Status:', bulkAssignResponse.status);
        console.log('Response:', JSON.stringify(bulkAssignResult, null, 2));

        if (bulkAssignResponse.status === 200) {
          console.log('✅ Bulk assignment successful\n');

          // Test bulk unassign
          console.log('6. Testing POST /api/associations/bulk (unassign)');
          const bulkUnassignResponse = await fetch(
            `${BASE_URL}/api/associations/bulk`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
                role_id: testRole.id,
                permission_ids: [testPermission.id],
                operation: 'unassign',
              }),
            }
          );
          const bulkUnassignResult = await bulkUnassignResponse.json();
          console.log('Status:', bulkUnassignResponse.status);
          console.log('Response:', JSON.stringify(bulkUnassignResult, null, 2));

          if (bulkUnassignResponse.status === 200) {
            console.log('✅ Bulk unassignment successful\n');
          } else {
            console.log('❌ Bulk unassignment failed\n');
          }
        } else {
          console.log('❌ Bulk assignment failed\n');
        }
      } else {
        console.log('❌ POST association failed');
      }
    } else {
      console.log('⚠️ No roles or permissions found for testing');
    }

    console.log('🎉 All association API tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAssociationsAPI();
