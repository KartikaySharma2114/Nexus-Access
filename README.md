# RBAC Configuration Tool

A modern Role-Based Access Control (RBAC) management system built with Next.js, Supabase, and TypeScript.

## Features

- 🔐 **Authentication** - Secure user authentication with Supabase Auth
- 👥 **Role Management** - Create and manage user roles
- 🔑 **Permission System** - Define granular permissions
- 🔗 **Association Management** - Link roles to permissions and users to roles
- 🤖 **AI Integration** - Natural language RBAC configuration with Google Gemini
- 🎨 **Modern UI** - Clean interface built with Tailwind CSS and Radix UI

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd rbac-tool
npm install
```

### 2. Set up Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Next.js Configuration
NEXTAUTH_SECRET=your_super_secret_jwt_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Google Gemini API for AI features
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Set up Database

1. Create a [Supabase](https://supabase.com) account and project
2. Go to SQL Editor in your Supabase dashboard
3. Run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/seed.sql` (optional - sample data)

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:setup` - Database setup guide
- `npm run db:verify` - Verify setup

## Project Structure

```
rbac-tool/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── lib/
│   │   ├── supabase/       # Supabase client and utilities
│   │   ├── types/          # TypeScript type definitions
│   │   └── validations/    # Form validation schemas
├── supabase/
│   ├── migrations/         # Database schema migrations
│   └── seed.sql           # Sample data
├── docs/                   # Documentation
└── scripts/               # Setup and utility scripts
```

## Security

⚠️ **Important Security Notes:**

- Never commit `.env.local` or any files containing secrets
- The `.env.local.example` file is safe to commit (contains no real credentials)
- Supabase anon keys are safe to expose in client-side code
- Always use environment variables for sensitive configuration
- Review the `.gitignore` file to ensure sensitive files are excluded

## Documentation

- [Supabase Setup Guide](docs/SUPABASE_SETUP.md) - Detailed database setup instructions
- [Database Schema](supabase/README.md) - Database structure and relationships

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Forms:** React Hook Form + Zod
- **TypeScript:** Full type safety
- **AI Integration:** Google Gemini API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass and code is formatted
5. Submit a pull request

## License

This project is licensed under the MIT License.
