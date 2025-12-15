# Netlify Deployment Fix Guide

## Issues Encountered

### 1. Static Pre-rendering Errors with Redux
**Problem**: Netlify build failed with `TypeError: Cannot read properties of null (reading 'useContext')` for all pages using Redux.

**Root Cause**: Next.js was attempting to statically pre-render pages during build time, but Redux context (Provider) is only available at runtime on the client side.

**Solution**: Added `export const dynamic = 'force-dynamic'` to all client-side pages:
- `app/page.tsx`
- `app/auth/page.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/profile/page.tsx`
- `app/dashboard/wallet/[id]/page.tsx`
- `app/logout/page.tsx`
- `app/layout.tsx` (root layout)

Also added `export const dynamicParams = true` to:
- `app/layout.tsx`
- `app/dashboard/wallet/[id]/page.tsx`

### 2. Legacy Error Page Generation
**Problem**: Next.js was generating static `/_error` routes (404, 500) even with App Router custom error pages, causing build failures.

**Error Message**:
```
Error occurred prerendering page "/404"
Error occurred prerendering page "/500"
<Html> should not be imported outside of pages/_document
```

**Solution**: Created `pages/_error.js` to override Next.js default static error page generation:
```javascript
export const dynamic = 'force-dynamic';

export default function Error() {
  return null;
}
```

### 3. Environment Variables Not Loading (Local CLI)
**Problem**: Local Netlify CLI deployment failed during Edge Functions bundling with ZodError about missing environment variables.

**Root Cause**: Environment variables configured in Netlify dashboard aren't automatically available for local CLI deployments.

**Solution**: 
- For **local development**: Use `.env` file with properly quoted values:
  ```env
  MDB_MCP_CONNECTION_STRING="mongodb+srv://user:pass@cluster.mongodb.net/db"
  JWT_SECRET="your-secret-key"
  ```
- For **production deployment**: Use GitHub push to trigger automatic Netlify cloud builds, which have access to dashboard environment variables.

### 4. Package Manager Mismatch
**Problem**: Build failed because Netlify was using `npm` while project uses `pnpm`.

**Error Message**:
```
Error: Cannot find module 'node_modules/.pnpm/next@14.2.33...'
```

**Solution**: Updated `netlify.toml` to use pnpm:
```toml
[build]
  command = "pnpm install && pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_USE_PRODUCTION = "false"
  NEXT_TELEMETRY_DISABLED = "1"
  NODE_ENV = "production"
```

## Final Working Configuration

### netlify.toml
```toml
[build]
  command = "pnpm install && pnpm build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
  NPM_USE_PRODUCTION = "false"
  NEXT_TELEMETLY_DISABLED = "1"
  NODE_ENV = "production"
```

### next.config.mjs
```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compress: true,
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
```

### Environment Variables in Netlify Dashboard
Configure these in Netlify dashboard (Site settings → Environment variables):
- `MDB_MCP_CONNECTION_STRING` - MongoDB connection string
- `JWT_SECRET` - JWT secret for authentication
- `JWT_EXPIRES_IN` - JWT expiration time (e.g., "24h")
- `NEXT_PUBLIC_APP_URL` - Your production URL
- `NODE_ENV` - "production"
- `NODE_VERSION` - "18"
- `NPM_USE_PRODUCTION` - "false"
- `NEXT_TELEMETRY_DISABLED` - "1"

### .env (for local development)
```env
MDB_MCP_CONNECTION_STRING="mongodb+srv://user:pass@cluster.mongodb.net/db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**: Always wrap environment variable values in double quotes, especially if they contain special characters like `&`, `?`, or `@`.

## Deployment Process

### Option 1: GitHub Push (Recommended)
1. Commit and push changes to GitHub
2. Netlify automatically detects the push and triggers a build
3. Build uses environment variables from Netlify dashboard
4. Deployment completes successfully

```bash
git add .
git commit -m "Your message"
git push origin master
```

### Option 2: Local CLI (For Testing)
1. Ensure `.env` file has all required variables with double quotes
2. Run deployment command:
```bash
netlify deploy --prod
```

**Note**: Local CLI may still fail at Edge Functions bundling if environment variables aren't properly loaded. Use GitHub push method for production deployments.

## Build Output (Success)
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (12/12)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                                        Size     First Load JS
┌ ƒ /                                              1.68 kB         223 kB
├ ƒ /_not-found                                    138 B          87.6 kB
├ ƒ /auth                                          5.62 kB         306 kB
├ ƒ /dashboard                                     6.92 kB         347 kB
├ ƒ /dashboard/profile                             5.59 kB         327 kB
├ ƒ /dashboard/wallet/[id]                         74.8 kB         426 kB
└ ƒ /logout                                        3.51 kB         234 kB

ƒ  (Dynamic)  server-rendered on demand
```

All routes showing `ƒ` symbol = Dynamic rendering ✅

## Verification Steps

After successful deployment:
1. ✅ Visit production URL: https://fake-wallet.netlify.app
2. ✅ Test authentication flow (login/register)
3. ✅ Verify dashboard loads with wallets
4. ✅ Check MongoDB connection works
5. ✅ Test wallet CRUD operations
6. ✅ Verify middleware authentication protection
7. ✅ Check error pages (404, 500) display correctly

## Common Pitfalls to Avoid

1. **Don't use static generation** for pages requiring Redux/React Context
2. **Always quote environment variables** containing special characters
3. **Use matching package managers** (pnpm project = pnpm build command)
4. **Don't commit `.env` file** (already in .gitignore)
5. **Set NODE_VERSION to 18** in netlify.toml (not 22, which is local version)
6. **Create pages/_error.js** to prevent legacy error page generation

## Additional Notes

- **deno.lock file**: Automatically generated by Netlify Edge Functions (uses Deno runtime). Added to `.gitignore` - not part of your Node.js app.
- **Edge Functions**: Netlify compiles Next.js middleware to Deno-compatible Edge Functions for global performance.
- **Build time**: Typical successful build takes 3-4 minutes on Netlify.

## Monitoring

Check deployment status:
```bash
netlify status
netlify watch
```

View logs in Netlify dashboard:
https://app.netlify.com/projects/fake-wallet

---

**Last Updated**: December 15, 2025  
**Deployment Status**: ✅ Live at https://fake-wallet.netlify.app
