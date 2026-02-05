# Architecture Migration Summary

## Overview

The STUHackathon application has been refactored to use **Managed Identity** and **On-Behalf-Of (OBO) authentication flow**, eliminating the need for API keys and providing a more secure, enterprise-ready architecture.

## What Changed

### Before (API Key-Based)

```
Frontend (React) → Azure AI Foundry API (with API key)
```

**Issues:**
- API keys stored in environment variables
- Key rotation complexity
- No user context in Foundry calls
- Direct frontend-to-Foundry communication

### After (Managed Identity + OBO)

```
Frontend → Backend API → Azure AI Foundry (with user context)
```

**Benefits:**
- No API keys anywhere
- User identity preserved throughout chain
- RBAC-based access control
- Backend can enforce additional security policies
- Centralized logging and monitoring

## Changes Made

### 1. New Backend API (`/api`)

Created a new Node.js + Express + TypeScript backend with:
- OBO flow implementation using `@azure/identity`
- Managed Identity support for Container Apps
- Bearer token validation middleware
- Azure AI Foundry client with user context
- CORS, rate limiting, and security headers

**Files:**
- `api/src/index.ts` - Express server
- `api/src/services/foundryClient.ts` - Foundry client with OBO
- `api/src/routes/chat.ts` - Chat endpoint
- `api/src/middleware/auth.ts` - Token validation
- `api/Dockerfile` - Multi-stage Docker build

### 2. Frontend Updates

Updated React frontend to:
- Call backend API instead of Foundry directly
- Pass user Bearer token in Authorization header
- Use new `BackendApiClient` with MSAL integration
- Remove API key references

**Modified Files:**
- `frontend/src/services/backendApiClient.ts` (new)
- `frontend/src/services/chatService.ts` (simplified)
- `frontend/src/components/ChatContainer.tsx` (updated)

### 3. Environment Configuration

Removed API keys from environment files:

**Before:**
```env
VITE_FOUNDRY_API_URL=https://...
VITE_FOUNDRY_API_KEY=sk-...  ❌
```

**After:**
```env
VITE_API_URL=https://backend-api-url/api  ✅
# No API keys needed!
```

### 4. Deployment Scripts

Created automated deployment scripts with Managed Identity setup:
- `deploy.sh` (Bash for macOS/Linux)
- `deploy.ps1` (PowerShell for Windows)

Both scripts:
- Create Azure Container Registry
- Build and push Docker images
- Deploy backend API with system-assigned identity
- Deploy frontend
- Display post-deployment RBAC instructions

### 5. Documentation

Added comprehensive documentation:
- `docs/MANAGED_IDENTITY_SETUP.md` - Complete setup guide
- Updated `README.md` - New architecture overview
- Updated `api/README.md` - Backend API documentation
- Updated `.github/copilot-instructions.md` - Development guidelines

## Security Improvements

### Authentication Flow

**Before:**
```
User → Frontend (with API key) → Foundry
```
- No user context
- Shared credentials
- Key exposure risk

**After:**
```
User (Azure AD token) → Frontend → Backend (Managed Identity + OBO) → Foundry
```
- User identity preserved
- No shared secrets
- Per-user permissions

### RBAC Required

**Backend API Managed Identity:**
```bash
az role assignment create \
  --assignee <PRINCIPAL_ID> \
  --role "Cognitive Services User" \
  --scope <FOUNDRY_RESOURCE_SCOPE>
```

**Foundry Managed Identity:**
```bash
az role assignment create \
  --assignee <FOUNDRY_PRINCIPAL_ID> \
  --role "Contributor" \
  --scope <FABRIC_WORKSPACE_SCOPE>
```

## Migration Steps for Existing Deployments

1. **Deploy Backend API:**
   ```bash
   ./deploy.sh  # or deploy.ps1 on Windows
   ```

2. **Assign RBAC Roles:**
   ```bash
   # Get Managed Identity Principal ID from deployment output
   az role assignment create \
     --assignee <PRINCIPAL_ID> \
     --role "Cognitive Services User" \
     --scope <FOUNDRY_RESOURCE_SCOPE>
   ```

3. **Update Frontend Environment:**
   ```bash
   # Update .env.production
   VITE_API_URL=https://app-stuhackathon-api.<region>.azurecontainerapps.io/api
   # Remove VITE_FOUNDRY_API_KEY
   ```

4. **Rebuild and Deploy Frontend:**
   ```bash
   cd frontend
   npm run build
   # Deploy to Container Apps
   ```

5. **Update Azure AD Redirect URIs:**
   - Add backend FQDN if needed
   - Ensure frontend FQDN is registered

6. **Test End-to-End:**
   - User authentication
   - Chat functionality
   - Thread continuity
   - Error handling

## Breaking Changes

⚠️ **API Contract Changes:**

**Old Frontend Call (removed):**
```typescript
// fabricAgentApiClient.ts
headers: { 'api-key': API_KEY }  // ❌ Removed
```

**New Frontend Call:**
```typescript
// backendApiClient.ts
headers: { 'Authorization': `Bearer ${userToken}` }  // ✅ New
```

**New Backend**:
- Requires Bearer token in Authorization header
- Returns structured response with `threadId` for continuity
- No backward compatibility with direct Foundry calls

## Rollback Plan

If issues arise, you can temporarily re-enable key-based auth:

```bash
# Re-enable key-based authentication
az cognitiveservices account update \
  --resource-group rg-stuhackathon-dev \
  --name aif-multiagentkuy2y \
  --custom-domain aif-multiagentkuy2y \
  --set properties.disableLocalAuth=false

# Revert frontend to call Foundry directly (use git)
git checkout main -- frontend/src/services/fabricAgentApiClient.ts
```

## Testing Checklist

- [ ] Backend API health check returns 200
- [ ] Frontend Azure AD authentication works
- [ ] Chat message sent successfully
- [ ] Conversation thread maintained across messages
- [ ] Managed Identity has required roles
- [ ] CORS allows frontend domain
- [ ] Rate limiting functions correctly
- [ ] Error messages are user-friendly
- [ ] Logs show user context (not API key)

## Monitoring

Enable Application Insights for both Container Apps:

```bash
az containerapp update \
  --name app-stuhackathon-api \
  --resource-group rg-stuhackathon-dev \
  --set-env-vars APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
```

Monitor:
- Request success rates
- Token acquisition failures
- Azure AI Foundry call latency
- User authentication events

## Next Steps

1. **Enable diagnostic logging** for audit trails
2. **Set up alerting** for authentication failures
3. **Configure auto-scaling** based on load
4. **Implement caching** for frequent queries
5. **Add telemetry** with Application Insights
6. **Set up CI/CD** with GitHub Actions

## Resources

- [Azure Container Apps Managed Identity](https://learn.microsoft.com/azure/container-apps/managed-identity)
- [On-Behalf-Of Flow Documentation](https://learn.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow)
- [Azure AI Foundry Authentication](https://learn.microsoft.com/azure/ai-foundry/concepts/authentication-authorization-foundry)
- [Managed Identity Setup Guide](MANAGED_IDENTITY_SETUP.md)
