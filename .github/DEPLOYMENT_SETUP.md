# GitHub Actions Deployment Setup

## Overview

The frontend deployment workflow (`frontend-deploy.yml`) automatically builds and deploys your React application to Azure Container Apps whenever you push code to the `main` or `comeredon` branches.

## Workflow Triggers

The workflow runs when:
- Code is pushed to `main` or `comeredon` branches
- Changes are made in the `frontend/` directory or the workflow file itself

## Required GitHub Secrets

You need to configure the following secret in your GitHub repository:

### AZURE_CREDENTIALS

This secret contains the Azure Service Principal credentials needed to authenticate with Azure.

#### Steps to Create AZURE_CREDENTIALS:

1. **Create a Service Principal** (if you don't have one):
   ```bash
   az ad sp create-for-rbac \
     --name "github-actions-stuhackathon" \
     --role contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/rg-stuhackathon-dev \
     --sdk-auth
   ```

2. **Grant ACR permissions** (if needed):
   ```bash
   # Get the Service Principal App ID from the previous command output
   SP_APP_ID="<app-id-from-previous-command>"
   
   # Grant AcrPush role
   az role assignment create \
     --assignee $SP_APP_ID \
     --scope /subscriptions/{subscription-id}/resourceGroups/rg-stuhackathon-dev/providers/Microsoft.ContainerRegistry/registries/acrstuhackathonfrontend \
     --role AcrPush
   ```

3. **Copy the JSON output** from step 1, which looks like:
   ```json
   {
     "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
     "clientSecret": "your-secret-value",
     "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
     "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
     "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
     "resourceManagerEndpointUrl": "https://management.azure.com/",
     "activeDirectoryGraphResourceId": "https://graph.windows.net/",
     "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
     "galleryEndpointUrl": "https://gallery.azure.com/",
     "managementEndpointUrl": "https://management.core.windows.net/"
   }
   ```

4. **Add the secret to GitHub**:
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AZURE_CREDENTIALS`
   - Value: Paste the entire JSON output from step 1
   - Click "Add secret"

## Workflow Details

The workflow performs these steps:

1. **Checkout code** - Gets the latest code from the repository
2. **Set up Node.js** - Configures Node.js 18 environment
3. **Install dependencies** - Runs `npm ci` in the frontend directory
4. **Build React app** - Runs `npm run build` to create production build
5. **Generate image tag** - Creates a unique tag using timestamp and commit SHA (format: `YYYYMMDDHHMMSS-{short-sha}`)
6. **Azure login** - Authenticates with Azure using the service principal
7. **ACR login** - Logs into Azure Container Registry
8. **Build and push Docker image** - Builds the Docker image and pushes both tagged and latest versions
9. **Deploy to Container Apps** - Updates the container app with the new image
10. **Summary** - Displays deployment information

## Image Tags

Each deployment creates two image tags:
- **Timestamped tag**: `{YYYYMMDDHHMMSS}-{commit-short-sha}` (e.g., `20260205143022-a1b2c3d`)
- **Latest tag**: `latest`

This allows you to:
- Track specific deployments by timestamp and commit
- Always have a `latest` version available for quick deployment

## Testing the Workflow

1. Make a change in the `frontend/` directory
2. Commit and push to `main` or your working branch:
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```
3. Go to the "Actions" tab in your GitHub repository to watch the workflow run

## Troubleshooting

### Authentication Errors
- Verify `AZURE_CREDENTIALS` secret is correctly configured
- Ensure the Service Principal has Contributor role on the resource group
- Ensure the Service Principal has AcrPush role on the container registry

### Build Errors
- Check that `frontend/package.json` has correct dependencies
- Verify `npm run build` works locally
- Check workflow logs for specific error messages

### Deployment Errors
- Verify the container app name and resource group are correct in the workflow
- Ensure the ACR name matches your actual registry
- Check Azure Container Apps logs for runtime errors

## Customization

### Add More Branches
Edit `.github/workflows/frontend-deploy.yml` and add branches to the trigger:
```yaml
on:
  push:
    branches:
      - main
      - develop  # Add this
      - staging  # Or this
```

### Environment-Specific Deployments
To deploy to different environments (dev/prod), you can:
1. Create separate workflow files for each environment
2. Use different resource groups and container apps per environment
3. Use GitHub Environments to manage secrets per environment

### Skip CI
To skip the workflow on a specific commit, include `[skip ci]` in your commit message:
```bash
git commit -m "Update docs [skip ci]"
```

## Monitoring

After deployment:
- Check GitHub Actions logs for build/deployment details
- Monitor Azure Container Apps logs: `az containerapp logs show --name app-stuhackathon-frontend --resource-group rg-stuhackathon-dev --follow`
- View live application at your Container Apps URL

## Security Notes

- Never commit Azure credentials to the repository
- Use GitHub Secrets for all sensitive values
- Regularly rotate Service Principal credentials
- Use Managed Identity where possible for Azure resource access
- Limit Service Principal permissions to only what's needed
