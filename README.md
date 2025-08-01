# RBAC Configuration Tool

A modern Role-Based Access Control (RBAC) management system built with Next.js 15, Supabase, and AI-powered natural language commands.

## What is RBAC?

RBAC controls who can access what in your application by assigning permissions to roles, then roles to users. Instead of managing individual user permissions, you create roles like "Admin" or "Editor" with specific permissions, making access control scalable and organized.

## Features

- **Permission Management**: Create and manage granular permissions
- **Role Management**: Define roles and assign permissions to them
- **Visual Association Matrix**: See role-permission relationships at a glance
- **AI Commands**: Use natural language to manage RBAC (e.g., "Create admin role with all permissions")
- **Real-time Updates**: Changes sync instantly across all users
- **Secure Authentication**: Built on Supabase Auth with row-level security

## Quick Start

1. **Clone and Install**:

   ```bash
   git clone <repository-url>
   cd rbac-tool
   npm install --legacy-peer-deps
   ```

2. **Set up Environment**:

   ```bash
   cp .env.example .env.local
   # Add your Supabase and Google AI API keys
   ```

3. **Run Development Server**:

   ```bash
   npm run dev
   ```

4. **Visit**: http://localhost:3000

## Test Credentials

For evaluation purposes, use these test credentials:

- **Email**: admin@rbac-tool.com
- **Password**: TestAdmin123!

## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [API Documentation](./docs/api.md) - API endpoints reference
- [Component Guide](./docs/components.md) - UI components documentation

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **AI**: Google Gemini API for natural language processing
- **Deployment**: Vercel with GitHub Actions CI/CD

## License

MIT License - see LICENSE file for details.
