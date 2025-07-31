# Supabase Database Setup

This directory contains the database schema and configuration for the RBAC Configuration Tool.

## Database Schema

The application uses the following tables:

### Core Tables

1. **permissions** - Stores individual permissions
   - `id` (UUID, Primary Key)
   - `name` (Text, Unique) - Permission name
   - `description` (Text, Optional) - Permission description
   - `created_at` (Timestamp)

2. **roles** - Stores roles
   - `id` (UUID, Primary Key)
   - `name` (Text, Unique) - Role name
   - `created_at` (Timestamp)

3. **role_permissions** - Junction table for role-permission associations
   - `role_id` (UUID, Foreign Key to roles.id)
   - `permission_id` (UUID, Foreign Key to permissions.id)
   - `created_at` (Timestamp)
   - Primary Key: (role_id, permission_id)

4. **user_roles** - Junction table for user-role associations
   - `user_id` (UUID, Foreign Key to auth.users.id)
   - `role_id` (UUID, Foreign Key to roles.id)
   - `created_at` (Timestamp)
   - Primary Key: (user_id, role_id)

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Authenticated users** can view all RBAC data
- **Admin users** can modify RBAC configurations
- **Users** can only see their own role assignments

## Files

- `migrations/001_initial_schema.sql` - Creates the database schema
- `migrations/002_rls_policies.sql` - Sets up Row Level Security policies
- `seed.sql` - Sample data for testing
- `config.toml` - Supabase local development configuration

## Setup Instructions

1. Install Supabase CLI: `npm install -g supabase`
2. Initialize Supabase: `supabase init`
3. Start local development: `supabase start`
4. Run migrations: `supabase db reset`
5. Seed data: `supabase db seed`

## Environment Variables

Make sure to set the following environment variables in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```