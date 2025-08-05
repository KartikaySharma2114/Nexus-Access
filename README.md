# Nexus Access

A modern, AI-powered Role-Based Access Control (RBAC) management system built with Next.js 15, Supabase, and natural language processing capabilities.

## 🎯 What is RBAC?

Role-Based Access Control (RBAC) is a security model that controls system access by assigning permissions to roles, then roles to users. Instead of managing individual user permissions, you create roles like "Admin" or "Editor" with specific permissions, making access control scalable, organized, and secure.

## ✨ Features

### Core RBAC Management
- **🔐 Permission Management**: Create and manage granular permissions with descriptions
- **👥 Role Management**: Define roles and assign multiple permissions efficiently  
- **📊 Visual Association Matrix**: Interactive grid showing role-permission relationships
- **🔄 Real-time Updates**: Changes sync instantly across all connected users

### AI-Powered Interface
- **🤖 Natural Language Commands**: Use plain English to manage RBAC
  - *"Create admin role with all permissions"*
  - *"Remove write access from editor role"*
  - *"Show me all users with delete permissions"*
- **🧠 Smart Suggestions**: AI-powered recommendations for role configurations

### Security & Performance
- **🛡️ Row-Level Security**: Built-in Supabase RLS policies
- **⚡ Optimistic Updates**: Instant UI feedback with rollback on errors
- **🔒 Secure Authentication**: Multi-provider auth with session management
- **📱 Responsive Design**: Works seamlessly on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google AI API key (for natural language features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KartikaySharma2114/RBAC-Configuration-Tool.git
   cd rbac-tool
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your credentials:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Google AI Configuration  
   GOOGLE_GEMINI_API_KEY=your_google_ai_api_key
   
   # Application Configuration
   NEXTAUTH_SECRET=your_secure_random_string
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   # If using Supabase CLI locally
   npm run supabase:start
   npm run db:seed
   
   # Or run the manual seed script
   npm run db:seed-manual
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Demo Credentials

For testing purposes, you can use these sample credentials:

- **Email**: `admin@rbac-tool.com`
- **Password**: `TestAdmin123!`

## 🏗️ Project Structure

```
rbac-tool/
├── src/
│   ├── app/                 # Next.js 15 App Router
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configurations
│   └── middleware.ts       # Auth and security middleware
├── supabase/
│   ├── migrations/         # Database schema migrations
│   └── seed.sql           # Sample data for development
├── scripts/               # Database and deployment scripts
└── public/               # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Query** - Server state management

### Backend & Database
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Row-Level Security** - Database-level access control
- **Supabase Auth** - Multi-provider authentication

### AI & APIs
- **Google Gemini API** - Natural language processing
- **Structured AI Responses** - Type-safe AI interactions

### Development & Deployment
- **ESLint + Prettier** - Code quality and formatting
- **Vercel** - Deployment and hosting
- **GitHub Actions** - CI/CD pipeline

## 📚 Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking

# Database
npm run db:reset        # Reset Supabase database
npm run db:seed         # Seed database with sample data
npm run supabase:start  # Start local Supabase instance

# Deployment
npm run deploy          # Deploy to Vercel production
npm run deploy:preview  # Deploy preview build
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `GOOGLE_GEMINI_API_KEY` | Google AI API key | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |

### Database Schema

The application uses a simple but powerful RBAC schema:

- **Users** - Authentication and user profiles
- **Roles** - Named collections of permissions
- **Permissions** - Granular access rights
- **Role_Permissions** - Many-to-many relationship
- **User_Roles** - User role assignments

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Vercel
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend-as-a-service
- [Vercel](https://vercel.com) for seamless deployment
- [Radix UI](https://radix-ui.com) for accessible components
- [Google AI](https://ai.google.dev) for natural language processing

---

**Built with ❤️ using Next.js 15 and Supabase**
