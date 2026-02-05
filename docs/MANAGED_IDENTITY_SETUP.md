# Managed Identity Setup Guide

This guide explains how to configure Managed Identity for secure, keyless authentication between your Container Apps and Azure AI Foundry.

## Architecture

```
User (Browser)
  ↓ Azure AD token
Frontend (Container App)
  ↓ User Bearer token
Backend API (Container App with Managed Identity)
  ↓ On-Behalf-Of (OBO) flow
Azure AI Foundry
  ↓ Managed Identity
Microsoft Fabric Lakehouse
```

## Prerequisites

- Azure subscription
- Azure CLI installed
- Docker installed (for local testing)
- Azure AI Foundry project with Fabric data agent enabled

## Deployment Steps

### 1. Run Deployment Script

The deployment script will prompt you for all necessary configuration values.

**On macOS/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**On Windows (PowerShell):**
```powershell
.\deploy.ps1
```

**You will be prompted for:**
- Resource Group name (where your Azure AI Foundry is deployed)
- Container Registry name (will be created if doesn't exist)
- Container Apps Environment name
- Azure AI Foundry endpoint, project ID, and agent ID
- Azure Tenant ID and Client ID
- Backend and frontend app names

The script will:
- Verify the resource group exists
- Use the same location as the resource group
- Check if Container Registry and Environment exist before creating
- Build and deploy both backend and frontend containers
- Enable Managed Identity on the backend API

### 2. RBAC Roles (Automatically Assigned)

The deployment script **automatically** assigns the following roles to the backend API's Managed Identity:

#### A. Cognitive Services User Role
✅ Automatically assigned on Azure AI Foundry resource  
- Allows the backend API to call Azure AI Foundry APIs on behalf of users

#### B. AcrPull Role
✅ Automatically assigned on Container Registry  
- Allows Container Apps to pull images from the private registry

**Role propagation:** The script waits 30 seconds for role assignments to propagate through Azure AD.

**If automatic assignment fails:** You may need Owner or User Access Administrator permissions. The script will display the manual commands to run.

### 3. Update Azure AD App Registration

Add the deployed URLs to your Azure AD app registration redirect URIs:

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find your app (client ID: `dd26d38d-bb41-445d-8aca-8bc7fc4215d3`)
4. Go to **Authentication** → **Platform configurations** → **Web**
5. Add redirect URIs:
   - `https://app-stuhackathon-frontend.<region>.azurecontainerapps.io`
   - `https://app-stuhackathon-frontend.<region>.azurecontainerapps.io/.auth/login/aad/callback`

### 4. Verify Deployment

Test the deployed application:

```bash
# Replace with your actual FQDNs from deployment output

# Check backend API health
curl https://app-stuhackathon-api.<region>.azurecontainerapps.io/health

# Expected response:
# {"status":"healthy","timestamp":"...","environment":"production"}

# Check frontend in browser
open https://app-stuhackathon-frontend.<region>.azurecontainerapps.io
```

**Test the full flow:**
1. Open the frontend URL
2. Sign in with Azure AD
3. Send a test message like "Show me sales data"
4. Verify you get a response from Foundry

**Check logs if issues occur:**
```bash
# Backend API logs
az containerapp logs show \
  --name app-stuhackathon-api \
  --resource-group <YOUR_RESOURCE_GROUP> \
  --follow

# Frontend logs
az containerapp logs show \
  --name app-stuhackathon-frontend \
  --resource-group <YOUR_RESOURCE_GROUP> \
  --follow
```

## Security Best Practices

### 1. Managed Identity Configuration

✅ **Do:**
- Use system-assigned identities for single-resource workloads
- Apply principle of least privilege (only assign necessary roles)
- Enable diagnostic logging for audit trails
- Separate identities per environment (dev, staging, prod)

❌ **Don't:**
- Use API keys in production
- Share user-assigned identities across sensitive boundaries
- Grant broad permissions like Owner or Contributor

### 2. Authentication Flow

The application uses **On-Behalf-Of (OBO) flow**:

1. User authenticates with Azure AD in browser
2. Frontend receives user access token
3. Frontend sends user token to backend API
4. Backend API exchanges user token for Foundry access token using Managed Identity
5. Backend calls Azure AI Foundry on behalf of the user
6. User permissions are maintained throughout the chain

### 3. Token Scopes

Required scopes:
- Frontend: `https://cognitiveservices.azure.com/.default`
- Backend: Same scope for OBO exchange

### 4. CORS Configuration

Update CORS in backend to only allow your frontend domain:

```typescript
// api/src/index.ts
const allowedOrigins = [
  'https://app-stuhackathon-frontend.<region>.azurecontainerapps.io'
];
```

### 5. Rate Limiting

The backend includes rate limiting (100 requests per 15 minutes per IP). Adjust in:

```typescript
// api/src/index.ts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

## Troubleshooting

### "AuthenticationTypeDisabled" Error

If you see this error, key-based authentication is disabled but Managed Identity isn't working:

1. Verify role assignment:
```bash
az role assignment list \
  --assignee <PRINCIPAL_ID> \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-stuhackathon-dev"
```

2. Wait 5-10 minutes for RBAC propagation

3. Check backend logs:
```bash
az containerapp logs show \
  --name app-stuhackathon-api \
  --resource-group rg-stuhackathon-dev \
  --follow
```

### Token Acquisition Failures

Check that:
- `USE_MANAGED_IDENTITY=true` in backend environment variables
- Container App has system-assigned identity enabled
- Tenant ID matches your Azure AD tenant

### Frontend Can't Reach Backend

1. Verify `VITE_API_URL` in frontend matches backend FQDN
2. Check CORS configuration in backend
3. Ensure backend ingress is set to `external`

## Local Development

### Backend API

```bash
cd api
npm install

# Create .env file
cp .env.example .env

# Edit .env:
# - Set USE_MANAGED_IDENTITY=false
# - Set AZURE_CLIENT_SECRET for OBO (or leave blank to use user token directly)

npm run dev
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local:
# - Set VITE_API_URL=http://localhost:3000/api

npm run dev
```

## Monitoring

Enable Application Insights for monitoring:

```bash
# Create Application Insights
az monitor app-insights component create \
  --app app-insights-stuhackathon \
  --location eastus \
  --resource-group rg-stuhackathon-dev

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app app-insights-stuhackathon \
  --resource-group rg-stuhackathon-dev \
  --query instrumentationKey \
  --output tsv)

# Update Container Apps with instrumentation key
az containerapp update \
  --name app-stuhackathon-api \
  --resource-group rg-stuhackathon-dev \
  --set-env-vars APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

## Updating the Deployment

To update after code changes:

```bash
# Set your configuration (from initial deployment)
RESOURCE_GROUP="your-resource-group"
CONTAINER_REGISTRY="your-registry-name"
API_APP_NAME="your-api-app-name"
FRONTEND_APP_NAME="your-frontend-app-name"

# Rebuild and redeploy backend
cd api
az acr build --registry $CONTAINER_REGISTRY --image stuhackathon-api:latest .

az containerapp update \
  --name $API_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --image $CONTAINER_REGISTRY.azurecr.io/stuhackathon-api:latest

# Rebuild and redeploy frontend
cd ../frontend
az acr build --registry $CONTAINER_REGISTRY --image stuhackathon-frontend:latest .

az containerapp update \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --image $CONTAINER_REGISTRY.azurecr.io/stuhackathon-frontend:latest
```

## Resources

- [Azure Container Apps Managed Identity](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity)
- [Azure AI Foundry Authentication](https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/authentication-authorization-foundry)
- [On-Behalf-Of Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow)
- [Cognitive Services RBAC](https://learn.microsoft.com/en-us/azure/ai-services/authentication)
