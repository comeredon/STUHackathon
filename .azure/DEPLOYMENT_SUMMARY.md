# Azure Deployment Summary

**Deployment Date**: February 5, 2026
**Resource Group**: rg-stuhackathon-dev
**Location**: East US
**Subscription**: ME-MngEnvMCAP889022-comeredon-1

## Deployed Resources

### 1. Azure Container Registry
- **Name**: acrstuhackathonfrontend
- **Login Server**: acrstuhackathonfrontend.azurecr.io
- **SKU**: Basic
- **Admin Enabled**: Yes
- **Image**: stuhackathon-frontend:latest
- **Image Digest**: sha256:0f70f8bec2cc83ff198b2a437bcfd240ab95a2b5c3e662c4fa9858f34b2785ff

### 2. Container Apps Environment
- **Name**: env-stuhackathon-dev
- **Log Analytics Workspace**: workspace-rgstuhackathondevWSZA

### 3. Container App (Frontend)
- **Name**: app-stuhackathon-frontend
- **URL**: https://app-stuhackathon-frontend.redisland-998a235a.eastus.azurecontainerapps.io/
- **Image**: acrstuhackathonfrontend.azurecr.io/stuhackathon-frontend:latest
- **Target Port**: 80
- **Ingress**: External
- **Status**: Running ✅

## Configuration

### Environment Variables
- `VITE_FABRIC_AGENT_API_URL`: https://eahwkwofgcjezhp7nh5wnq4s5a-o34ofvdhaj5ebaa6wlkzsqexdy.datawarehouse.fabric.microsoft.com

### Pending Configuration
- Azure AD Client ID (for authentication)
- Azure AD Tenant ID

## Access

**Frontend Application**: https://app-stuhackathon-frontend.redisland-998a235a.eastus.azurecontainerapps.io/

## Next Steps

1. Configure Azure AD app registration
2. Update Container App with Azure AD environment variables
3. Test end-to-end functionality
4. Configure custom domain (optional)
5. Set up CI/CD pipeline for automated deployments

## Resource IDs

```
Resource Group: /subscriptions/4df3101f-4408-43b7-a373-d2b17b356115/resourceGroups/rg-stuhackathon-dev
ACR: /subscriptions/4df3101f-4408-43b7-a373-d2b17b356115/resourceGroups/rg-stuhackathon-dev/providers/Microsoft.ContainerRegistry/registries/acrstuhackathonfrontend
Container App Environment: /subscriptions/4df3101f-4408-43b7-a373-d2b17b356115/resourceGroups/rg-stuhackathon-dev/providers/Microsoft.App/managedEnvironments/env-stuhackathon-dev
```

## Management Commands

```bash
# View app logs
az containerapp logs show --name app-stuhackathon-frontend --resource-group rg-stuhackathon-dev --follow

# Restart app
az containerapp revision restart --name app-stuhackathon-frontend --resource-group rg-stuhackathon-dev

# Update app with new image
az containerapp update --name app-stuhackathon-frontend --resource-group rg-stuhackathon-dev --image acrstuhackathonfrontend.azurecr.io/stuhackathon-frontend:latest

# Scale app
az containerapp update --name app-stuhackathon-frontend --resource-group rg-stuhackathon-dev --min-replicas 1 --max-replicas 3
```
