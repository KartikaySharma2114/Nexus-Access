#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createTestUser() {
  console.log('🔐 Creating test user credentials...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error(
      '   - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard → Settings → API)'
    );
    console.error('\nPlease add these to your .env.local file');
    process.exit(1);
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Create test user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'password123',
      email_confirm: true, // Skip email confirmation
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Test user already exists: admin@example.com');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Test user created successfully!');
      console.log('   Email: admin@example.com');
      console.log('   Password: password123');
      console.log('   User ID:', data.user.id);
    }

    // Assign admin role to the test user (if roles exist)
    try {
      const { data: roles } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Admin')
        .single();

      if (roles) {
        const { error: roleError } = await supabase.from('user_roles').upsert({
          user_id:
            data?.user?.id ||
            (await supabase.auth.admin.listUsers()).data.users.find(
              (u) => u.email === 'admin@example.com'
            )?.id,
          role_id: roles.id,
        });

        if (!roleError) {
          console.log('✅ Admin role assigned to test user');
        }
      }
    } catch (roleError) {
      console.log('ℹ️  Roles not yet created - run database setup first');
    }

    console.log('\n🎉 Setup complete! You can now login with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: password123');
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
}

createTestUser();
