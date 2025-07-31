#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function seedDatabase() {
  console.log('🌱 Seeding database with initial data...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    console.error('This is needed to bypass RLS policies for seeding.');
    console.error('\nTo seed the database:');
    console.error(
      '1. Get your service role key from Supabase dashboard → Settings → API'
    );
    console.error('2. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
    console.error('3. Or run the SQL manually in your Supabase SQL Editor:');
    console.error('\n-- Copy and paste the content from supabase/seed.sql');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Insert sample permissions
  console.log('📋 Inserting permissions...');
  const permissions = [
    { name: 'read_users', description: 'Permission to view user information' },
    {
      name: 'write_users',
      description: 'Permission to create and update users',
    },
    { name: 'delete_users', description: 'Permission to delete users' },
    { name: 'read_reports', description: 'Permission to view reports' },
    {
      name: 'write_reports',
      description: 'Permission to create and update reports',
    },
    {
      name: 'admin_access',
      description: 'Full administrative access to the system',
    },
  ];

  for (const permission of permissions) {
    try {
      const { error } = await supabase
        .from('permissions')
        .upsert(permission, { onConflict: 'name' });

      if (error) {
        console.error(
          `❌ Failed to insert permission ${permission.name}:`,
          error.message
        );
      } else {
        console.log(`✅ Permission: ${permission.name}`);
      }
    } catch (err) {
      console.error(
        `❌ Error inserting permission ${permission.name}:`,
        err.message
      );
    }
  }

  // Insert sample roles
  console.log('\n👥 Inserting roles...');
  const roles = [
    { name: 'Admin' },
    { name: 'Manager' },
    { name: 'User' },
    { name: 'Viewer' },
  ];

  for (const role of roles) {
    try {
      const { error } = await supabase
        .from('roles')
        .upsert(role, { onConflict: 'name' });

      if (error) {
        console.error(`❌ Failed to insert role ${role.name}:`, error.message);
      } else {
        console.log(`✅ Role: ${role.name}`);
      }
    } catch (err) {
      console.error(`❌ Error inserting role ${role.name}:`, err.message);
    }
  }

  // Create role-permission associations
  console.log('\n🔗 Creating role-permission associations...');

  // Get all roles and permissions
  const { data: allRoles } = await supabase.from('roles').select('*');
  const { data: allPermissions } = await supabase
    .from('permissions')
    .select('*');

  if (!allRoles || !allPermissions) {
    console.error('❌ Failed to fetch roles or permissions');
    return;
  }

  const associations = [
    // Admin gets all permissions
    {
      roleName: 'Admin',
      permissions: [
        'read_users',
        'write_users',
        'delete_users',
        'read_reports',
        'write_reports',
        'admin_access',
      ],
    },
    // Manager gets most permissions except delete and admin
    {
      roleName: 'Manager',
      permissions: [
        'read_users',
        'write_users',
        'read_reports',
        'write_reports',
      ],
    },
    // User gets basic permissions
    { roleName: 'User', permissions: ['read_users', 'read_reports'] },
    // Viewer gets only read permissions
    { roleName: 'Viewer', permissions: ['read_reports'] },
  ];

  for (const association of associations) {
    const role = allRoles.find((r) => r.name === association.roleName);
    if (!role) continue;

    for (const permissionName of association.permissions) {
      const permission = allPermissions.find((p) => p.name === permissionName);
      if (!permission) continue;

      try {
        const { error } = await supabase.from('role_permissions').upsert(
          {
            role_id: role.id,
            permission_id: permission.id,
          },
          { onConflict: 'role_id,permission_id' }
        );

        if (error) {
          console.error(
            `❌ Failed to associate ${role.name} with ${permission.name}:`,
            error.message
          );
        } else {
          console.log(`✅ ${role.name} → ${permission.name}`);
        }
      } catch (err) {
        console.error(`❌ Error creating association:`, err.message);
      }
    }
  }

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   Permissions: ${permissions.length}`);
  console.log(`   Roles: ${roles.length}`);
  console.log(
    `   Associations: ${associations.reduce((sum, a) => sum + a.permissions.length, 0)}`
  );
}

seedDatabase().catch(console.error);
