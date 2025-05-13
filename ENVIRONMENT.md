# Environment Variables Configuration

This document describes how to properly configure environment variables for secure deployment.

## Local Development

Create a `.env.local` file in the project root with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Qdrant Configuration
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your-qdrant-api-key

# Application Settings
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## Vercel Deployment

When deploying to Vercel, add these environment variables in the Vercel project settings under "Environment Variables":

1. **System Environment Variables**: These are needed by the server but never exposed to the browser.
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `OPENAI_API_KEY`
   - `QDRANT_URL`
   - `QDRANT_API_KEY`
   - `NEXTAUTH_SECRET`

2. **Public Environment Variables**: These are necessary for client-side functionality.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_URL` (set to your production URL)

## Security Best Practices

1. **Never prefix sensitive API keys with `NEXT_PUBLIC_`**. This would expose them to the client, making them visible in the browser.

2. **Rotate keys regularly**, especially if you suspect they may have been compromised.

3. **Use API routes** for operations that require sensitive keys. The client should never directly communicate with external APIs using sensitive credentials.

4. **Set up proper CORS configuration** for your API routes to prevent unauthorized access.

5. **Implement proper authentication** to ensure only authorized users can access the API routes.

## API Routes

All operations requiring sensitive API keys should be performed through server-side API routes:

- `/api/embeddings` - For generating OpenAI embeddings
- `/api/vectors` - For Qdrant vector operations
- `/api/completions` - For OpenAI completions

The client-side code should use the utilities in `src/lib/client.ts` to interact with these API routes.

## Environment Variables Usage

| Variable | Server/Client | Purpose |
|----------|---------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both | Supabase anonymous key for client access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin privileges for server operations |
| `SUPABASE_JWT_SECRET` | Server only | JWT verification |
| `OPENAI_API_KEY` | Server only | Authentication for OpenAI API |
| `QDRANT_URL` | Server only | Connect to Qdrant vector database |
| `QDRANT_API_KEY` | Server only | Authentication for Qdrant API |
| `NEXTAUTH_URL` | Both | OAuth callback URL |
| `NEXTAUTH_SECRET` | Server only | Session encryption | 