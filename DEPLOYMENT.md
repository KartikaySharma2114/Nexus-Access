# Deployment Guide

This guide covers deploying the RBAC Configuration Tool to Vercel.

## Prerequisites

1. **Supabase Project**: Set up a Supabase project with the required database schema
2. **Google AI API Key**: Get an API key from Google AI Studio
3. **Vercel Account**: Create a Vercel account and install the Vercel CLI

## Environment Variables

Set up the following environment variables in your Vercel project:

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Application Configuration (optional)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Database Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Set up Database Schema**:

   ```sql
   -- Run this in your Supabase SQL editor

   -- Enable RLS
   ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

   -- Create permissions table
   CREATE TABLE permissions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR(100) UNIQUE NOT NULL,
     description TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create roles table
   CREATE TABLE roles (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR(100) UNIQUE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create role_permissions junction table
   CREATE TABLE role_permissions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
     permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(role_id, permission_id)
   );

   -- Create user_roles table
   CREATE TABLE user_roles (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, role_id)
   );

   -- Enable RLS on all tables
   ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies (allow authenticated users to read/write)
   CREATE POLICY "Allow authenticated users to manage permissions" ON permissions
     FOR ALL USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow authenticated users to manage roles" ON roles
     FOR ALL USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow authenticated users to manage role_permissions" ON role_permissions
     FOR ALL USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow authenticated users to manage user_roles" ON user_roles
     FOR ALL USING (auth.role() = 'authenticated');
   ```

3. **Create Test User**:
   - Go to Authentication > Users in Supabase dashboard
   - Create a test user with email/password

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy**:

   ```bash
   # For preview deployment
   npm run deploy:preview

   # For production deployment
   npm run deploy
   ```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

### Option 3: GitHub Actions (Automated)

1. **Set up GitHub Secrets**:
   - Go to your GitHub repository settings
   - Add the following secrets:
     - `VERCEL_TOKEN`: Your Vercel token
     - `VERCEL_ORG_ID`: Your Vercel organization ID
     - `VERCEL_PROJECT_ID`: Your Vercel project ID

2. **Push to trigger deployment**:
   ```bash
   git push origin main
   ```

## Post-Deployment

1. **Test the Application**:
   - Visit your deployed URL
   - Test login functionality
   - Create test permissions and roles
   - Test the AI command feature

2. **Monitor Performance**:
   - Check Vercel Analytics
   - Monitor Supabase usage
   - Review error logs

## Troubleshooting

### Common Issues

1. **Build Errors**:
   - Check that all environment variables are set
   - Verify TypeScript compilation with `npm run type-check`
   - Check for missing dependencies

2. **Database Connection Issues**:
   - Verify Supabase URL and keys
   - Check RLS policies are correctly set
   - Ensure database schema is properly created

3. **Authentication Issues**:
   - Verify Supabase auth configuration
   - Check redirect URLs in Supabase dashboard
   - Ensure middleware is properly configured

4. **AI Features Not Working**:
   - Verify Google AI API key is set
   - Check API quotas and limits
   - Review error logs for API issues

### Performance Optimization

1. **Enable Vercel Analytics**
2. **Configure caching headers**
3. **Optimize images and assets**
4. **Monitor Core Web Vitals**

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to version control
2. **RLS Policies**: Ensure proper Row Level Security policies are in place
3. **CORS Configuration**: Configure appropriate CORS settings
4. **Rate Limiting**: Monitor and implement rate limiting as needed

## Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Security Patches**: Apply security updates promptly
3. **Backup Strategy**: Implement database backup strategy
4. **Monitoring**: Set up error monitoring and alerting
