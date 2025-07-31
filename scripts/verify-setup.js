#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Supabase setup...\n');

const checks = [
  {
    name: 'Environment variables file exists',
    check: () => fs.existsSync('.env.local'),
    fix: 'Create .env.local file with Supabase credentials',
  },
  {
    name: 'Supabase client configuration exists',
    check: () => fs.existsSync('src/lib/supabase/client.ts'),
    fix: 'Client configuration is missing',
  },
  {
    name: 'Supabase server configuration exists',
    check: () => fs.existsSync('src/lib/supabase/server.ts'),
    fix: 'Server configuration is missing',
  },
  {
    name: 'Database schema migration exists',
    check: () => fs.existsSync('supabase/migrations/001_initial_schema.sql'),
    fix: 'Database schema migration is missing',
  },
  {
    name: 'RLS policies migration exists',
    check: () => fs.existsSync('supabase/migrations/002_rls_policies.sql'),
    fix: 'RLS policies migration is missing',
  },
  {
    name: 'Database utilities exist',
    check: () => fs.existsSync('src/lib/supabase/database.ts'),
    fix: 'Database utilities are missing',
  },
  {
    name: 'Authentication utilities exist',
    check: () => fs.existsSync('src/lib/supabase/auth.ts'),
    fix: 'Authentication utilities are missing',
  },
  {
    name: 'Error handling utilities exist',
    check: () => fs.existsSync('src/lib/supabase/errors.ts'),
    fix: 'Error handling utilities are missing',
  },
  {
    name: 'Type definitions exist',
    check: () => fs.existsSync('src/lib/types/database.ts'),
    fix: 'Database type definitions are missing',
  },
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);

  if (!passed) {
    console.log(`   Fix: ${fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Supabase setup is complete.');
  console.log('\nNext steps:');
  console.log('1. Update .env.local with your Supabase credentials');
  console.log('2. Run `npm run db:setup` to initialize the database');
  console.log('3. Run `npm run dev` to start development');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}

console.log('='.repeat(50));
