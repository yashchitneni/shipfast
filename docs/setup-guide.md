# Setup and Installation Guide

## Prerequisites

Before setting up Flexport, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** (latest version)
- **VS Code** (recommended) or your preferred code editor
- **Supabase Account** (free tier is sufficient)

## Quick Start

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/[your-org]/flexport-game.git

# Using SSH
git clone git@github.com:[your-org]/flexport-game.git

# Navigate to project directory
cd flexport-game
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GAME_VERSION=1.0.0

# Development Settings
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# API Configuration
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_MAX_RETRIES=3
```

### 4. Supabase Setup

#### Create a New Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Project name: `flexport-game`
   - Database password: (generate a strong password)
   - Region: (choose closest to your users)
4. Click "Create Project"
5. Wait for project initialization

#### Get Your API Keys

1. Go to Project Settings → API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

#### Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref [your-project-id]

# Run migrations
supabase db push
```

### 5. Start Development Server

```bash
# Start the development server
npm run dev

# Or with yarn
yarn dev

# Or with pnpm
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Detailed Setup

### Database Setup

#### 1. Create Database Schema

Run the SQL migrations in order:

```sql
-- 1. Run schema creation
supabase db push ./supabase/migrations/001_create_schema.sql

-- 2. Create tables
supabase db push ./supabase/migrations/002_create_tables.sql

-- 3. Set up RLS policies
supabase db push ./supabase/migrations/003_create_policies.sql

-- 4. Create functions and triggers
supabase db push ./supabase/migrations/004_create_functions.sql

-- 5. Seed initial data
supabase db push ./supabase/migrations/005_seed_data.sql
```

#### 2. Enable Realtime

```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE market_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
```

#### 3. Configure Storage Buckets

```bash
# Create storage buckets for game assets
supabase storage create assets
supabase storage create user-uploads
```

### Authentication Setup

#### 1. Configure Auth Providers

In Supabase Dashboard → Authentication → Providers:

1. **Email Auth** (enabled by default)
   - Enable email confirmations
   - Set redirect URLs

2. **OAuth Providers** (optional)
   - Google
   - GitHub
   - Discord

#### 2. Configure Auth Settings

```javascript
// lib/supabase/auth.config.ts
export const authConfig = {
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  email: {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`,
    confirmationTemplate: 'welcome_email'
  },
  oauth: {
    google: {
      scope: 'email profile'
    }
  }
}
```

### Asset Preparation

#### 1. Prepare Game Assets

Place your game assets in the correct directories:

```
public/
├── assets/
│   ├── sprites/
│   │   ├── ships/
│   │   ├── ports/
│   │   └── warehouses/
│   ├── tiles/
│   │   ├── ocean.png
│   │   └── land.png
│   ├── ui/
│   │   ├── buttons/
│   │   └── panels/
│   └── effects/
│       ├── water/
│       └── weather/
└── sounds/
    ├── music/
    └── sfx/
```

#### 2. Optimize Assets

```bash
# Install image optimization tools
npm install -D sharp imagemin imagemin-pngquant

# Run optimization script
npm run optimize-assets
```

### Development Tools Setup

#### 1. VS Code Extensions

Recommended extensions for development:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "naumovs.color-highlight",
    "usernamehw.errorlens"
  ]
}
```

#### 2. ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
}
```

#### 3. Prettier Configuration

```javascript
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Testing Setup

#### 1. Install Testing Dependencies

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

#### 2. Configure Jest

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Production Setup

### 1. Build for Production

```bash
# Create production build
npm run build

# Test production build locally
npm run start
```

### 2. Environment Variables

Create production environment variables:

```env
# Production .env
NEXT_PUBLIC_SUPABASE_URL=https://[production-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=production-anon-key
NEXT_PUBLIC_APP_URL=https://flexport-game.com
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to configure deployment
```

### 4. Configure Vercel Environment

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all production environment variables
3. Configure domains
4. Set up GitHub integration for auto-deployments

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Error

**Problem**: "Failed to connect to Supabase"

**Solution**:
- Check environment variables are set correctly
- Verify Supabase project is running
- Check network/firewall settings
- Ensure anon key is correct

#### 2. Build Errors

**Problem**: "Module not found" errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

#### 3. Asset Loading Issues

**Problem**: Images/sprites not loading

**Solution**:
- Check file paths are correct
- Ensure assets are in `public/` directory
- Verify file extensions match imports
- Check browser console for 404 errors

#### 4. Database Migration Errors

**Problem**: "Migration failed"

**Solution**:
```bash
# Reset database (CAUTION: deletes all data)
supabase db reset

# Re-run migrations
supabase db push
```

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// lib/debug.ts
export const debug = {
  enabled: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  log: (...args: any[]) => {
    if (debug.enabled) {
      console.log('[DEBUG]', ...args)
    }
  },
  error: (...args: any[]) => {
    if (debug.enabled) {
      console.error('[ERROR]', ...args)
    }
  }
}
```

## Performance Optimization

### 1. Enable SWC Minification

```javascript
// next.config.js
module.exports = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}
```

### 2. Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
}
```

### 3. Bundle Analysis

```bash
# Install bundle analyzer
npm install -D @next/bundle-analyzer

# Run analysis
ANALYZE=true npm run build
```

## Security Best Practices

### 1. Environment Variables

- Never commit `.env.local` to git
- Use different keys for development/production
- Rotate keys regularly
- Use GitHub Secrets for CI/CD

### 2. API Security

```javascript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname.startsWith('/game')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}
```

### 3. Rate Limiting

```javascript
// lib/rateLimit.ts
import { RateLimiter } from 'limiter'

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute',
  fireImmediately: true,
})

export async function checkRateLimit() {
  const remainingRequests = await limiter.removeTokens(1)
  if (remainingRequests < 0) {
    throw new Error('Rate limit exceeded')
  }
}
```

## Monitoring and Analytics

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/nextjs

npx @sentry/wizard -i nextjs
```

### 2. Analytics (Vercel Analytics)

```bash
npm install @vercel/analytics

# Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 3. Performance Monitoring

```javascript
// lib/performance.ts
export function measurePerformance(name: string, fn: () => void) {
  if (typeof window !== 'undefined' && window.performance) {
    const start = performance.now()
    fn()
    const end = performance.now()
    console.log(`${name} took ${end - start}ms`)
  } else {
    fn()
  }
}
```

## Next Steps

After setup is complete:

1. **Run the test suite** to ensure everything works
2. **Review the documentation** in `/docs`
3. **Explore the codebase** structure
4. **Join the Discord** for community support
5. **Check GitHub Issues** for known problems
6. **Start developing** your features!

## Support Resources

- **Documentation**: `/docs` directory
- **Discord**: [Join our Discord](https://discord.gg/flexport-game)
- **GitHub Issues**: Report bugs and request features
- **Stack Overflow**: Tag questions with `flexport-game`
- **Email Support**: support@flexport-game.com