#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up RBAC database...\n');

console.log('📋 Database setup instructions:\n');

console.log(
  'Since the Supabase CLI has installation issues, please follow these steps:\n'
);

console.log('🌐 OPTION 1: Use Cloud Supabase (Recommended)');
console.log('1. Go to https://supabase.com and create a free account');
console.log('2. Create a new project');
console.log('3. Go to Settings → API to get your credentials');
console.log('4. Copy the Project URL and anon key to your .env.local file');
console.log('5. Go to SQL Editor in your Supabase dashboard');
console.log('6. Run the migration files from supabase/migrations/ folder\n');

console.log('📁 Migration files to run in order:');
console.log('   - supabase/migrations/001_initial_schema.sql');
console.log('   - supabase/migrations/002_rls_policies.sql');
console.log('   - supabase/seed.sql (optional - for sample data)\n');

console.log('🔧 OPTION 2: Install Supabase CLI manually');
console.log('1. Download from: https://github.com/supabase/cli/releases');
console.log('2. Or use Scoop: scoop install supabase');
console.log('3. Or use Chocolatey: choco install supabase');
console.log('4. Then run: supabase start\n');

console.log('📝 Environment Variables needed in .env.local:');
console.log('   NEXT_PUBLIC_SUPABASE_URL=your_project_url');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
console.log('   NEXTAUTH_SECRET=any-random-string');
console.log('   NEXTAUTH_URL=http://localhost:3000\n');

console.log('✅ Once configured, run: npm run dev');

// Show the migration files content for easy copy-paste
console.log('\n📄 Migration Files Content:\n');

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const seedFile = path.join(process.cwd(), 'supabase', 'seed.sql');

if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir).sort();
  files.forEach((file) => {
    if (file.endsWith('.sql')) {
      console.log(`--- ${file} ---`);
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(content);
      console.log('\n');
    }
  });
}

if (fs.existsSync(seedFile)) {
  console.log('--- seed.sql (optional) ---');
  const content = fs.readFileSync(seedFile, 'utf8');
  console.log(content);
  console.log('\n');
}
