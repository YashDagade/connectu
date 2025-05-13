# Deployment Guide

This guide covers how to securely deploy the ConnectU application on Vercel.

## Overview of Security Improvements

The following security improvements have been implemented to ensure that sensitive credentials are not exposed to clients:

1. **Secure Environment Variables Management**:
   - Sensitive keys are no longer prefixed with `NEXT_PUBLIC_`
   - API keys are only accessible server-side
   - Client-server architecture with API routes for secure operations

2. **Server-Only Service Initialization**:
   - OpenAI client initialized only on the server
   - Qdrant vector database access restricted to server-side
   - Supabase admin operations restricted to server-side

3. **API Routes for Secure Operations**:
   - `/api/embeddings` - Secure vector embeddings generation
   - `/api/vectors` - Secure vector search and retrieval
   - `/api/completions` - Secure OpenAI completions
   - All routes have proper validation and error handling

4. **Environment Detection**:
   - Utilities to detect server vs. client context
   - Enforcement of server-only operations
   - Graceful error handling for misuse

## Deployment Steps

1. **Set Up Environment Variables in Vercel**:
   - Follow the guidelines in `ENVIRONMENT.md` to configure all required environment variables
   - Ensure sensitive keys are NOT prefixed with `NEXT_PUBLIC_`

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Configure the build settings (Next.js framework preset)
   - Set the environment variables as described
   - Deploy the application

3. **Verify Security**:
   - After deployment, verify that sensitive credentials are not exposed in client-side JavaScript
   - Check Network tab in browser dev tools to ensure API routes are functioning properly
   - Test with invalid/missing credentials to ensure proper error handling

## Post-Deployment Security Checks

1. **Network Request Inspection**:
   - Examine client-side network requests to ensure no sensitive keys are being transmitted
   - Verify that API routes are being used for operations requiring credentials

2. **Source Code Inspection**:
   - Verify that the client bundle doesn't contain sensitive credentials
   - Check that environment variables are properly secured

3. **Authentication Flow**:
   - Test the authentication process end-to-end
   - Verify session management and expiration

4. **Error Handling**:
   - Verify that error responses don't expose sensitive information
   - Ensure proper validation of all API inputs

## Ongoing Security Practices

1. **Regularly Rotate Credentials**:
   - Set up a schedule for changing API keys
   - Update environment variables in Vercel after rotation

2. **Monitor for Unusual Activity**:
   - Set up logging and alerts for unusual API usage
   - Monitor error rates and response times

3. **Keep Dependencies Updated**:
   - Regularly update dependencies to patch security vulnerabilities
   - Run security audits with `npm audit` or similar tools

4. **Implement Rate Limiting**:
   - Add rate limiting to API routes to prevent abuse
   - Consider adding CAPTCHA for public-facing forms 