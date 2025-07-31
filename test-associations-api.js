const BASE_URL = 'http://localhost:3000';

async function testAssociationsAPI() {
  console.log('Testing Associations API...\n');

  try {
    // Test GET associations
    console.log('1. Testing GET /api/associations');
    const getResponse = await fetch(`${BASE_URL}/api/associations`);
    const getResult = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getResult, null, 2));
    console.log('✅ GET associations successful\n');

    // Test GET roles and permissions to get IDs for testing
    console.log('2. Getting roles and permissions for testing');
    const rolesResponse = await fetch(`${BASE_URL}/api/roles`);
    const rolesResult = await rolesResponse.json();
    const permissionsResponse = await fetch(`${BASE_URL}/api/permissions`);
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
        headers: { 'Content-Type': 'application/json' },
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
          { method: 'DELETE' }
        );
        const deleteResult = await deleteResponse.json();
        console.log('Status:', deleteResponse.status);
        console.log('Response:', JSON.stringify(deleteResult, null, 2));
        console.log('✅ DELETE association successful\n');

        // Test bulk operations
        console.log('5. Testing POST /api/associations/bulk');
        const bulkResponse = await fetch(`${BASE_URL}/api/associations/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role_id: testRole.id,
            permission_ids: [testPermission.id],
            operation: 'assign',
          }),
        });
        const bulkResult = await bulkResponse.json();
        console.log('Status:', bulkResponse.status);
        console.log('Response:', JSON.stringify(bulkResult, null, 2));
        console.log('✅ Bulk assignment successful\n');
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
