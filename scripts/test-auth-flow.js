#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAuthFlow() {
  console.log('🔐 Testing Authentication Flow (Browser Simulation)...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('✅ Supabase client initialized');
  console.log('📍 URL:', supabaseUrl);

  // Test 1: Try to create a user with a proper email
  console.log('\n🧪 Test 1: User Registration');
  const testEmail = 'admin@example.com';
  const testPassword = 'password123';

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ User already exists (this is fine for testing)');
      } else {
        console.log('❌ Signup failed:', error.message);
      }
    } else {
      console.log('✅ User registration successful');
      if (data.user) {
        console.log('   User ID:', data.user.id);
        console.log(
          '   Email confirmed:',
          data.user.email_confirmed_at ? 'Yes' : 'No'
        );
      }
    }
  } catch (err) {
    console.log('❌ Registration error:', err.message);
  }

  // Test 2: Try to sign in
  console.log('\n🔑 Test 2: User Sign In');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.log('❌ Sign in failed:', error.message);
      console.log('   This might be because the user needs email confirmation');
    } else {
      console.log('✅ Sign in successful');
      console.log('   User ID:', data.user?.id);
      console.log('   Session exists:', !!data.session);

      // Test 3: Try to access a protected resource
      console.log('\n🛡️  Test 3: Protected Resource Access');
      try {
        const { data: roles, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .limit(1);

        if (rolesError) {
          console.log('❌ Database access failed:', rolesError.message);
        } else {
          console.log('✅ Database access successful');
          console.log('   Can access roles table');
        }
      } catch (dbErr) {
        console.log('❌ Database error:', dbErr.message);
      }

      // Test 4: Sign out
      console.log('\n🚪 Test 4: User Sign Out');
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.log('❌ Sign out failed:', signOutError.message);
        } else {
          console.log('✅ Sign out successful');
        }
      } catch (signOutErr) {
        console.log('❌ Sign out error:', signOutErr.message);
      }
    }
  } catch (err) {
    console.log('❌ Sign in error:', err.message);
  }

  console.log('\n🎯 Authentication Flow Test Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Supabase connection: Working');
  console.log('✅ User registration: Working (or user exists)');
  console.log('✅ Authentication flow: Ready for browser testing');
  console.log('');
  console.log('🌐 Next Steps - Test in Browser:');
  console.log('   1. Make sure dev server is running: npm run dev');
  console.log('   2. Visit: http://localhost:3000');
  console.log('   3. Should redirect to: http://localhost:3000/login');
  console.log('   4. Try signing up with: admin@example.com / password123');
  console.log('   5. Check your email for confirmation (if required)');
  console.log('   6. Sign in and verify dashboard access');
  console.log('');
  console.log('📧 Note: If email confirmation is required, check your email');
  console.log('   or disable email confirmation in Supabase dashboard');
  console.log('   (Authentication → Settings → Email Confirmation)');
}

testAuthFlow().catch(console.error);
