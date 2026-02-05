# Build and Deploy Script for Azure Container App
# This script rebuilds the Docker image with environment variables and deploys to Azure

$REGISTRY = "acrstuhackathonfrontend"
$IMAGE_NAME = "stuhackathon-frontend:latest"
$RESOURCE_GROUP = "rg-stuhackathon-dev"
$APP_NAME = "app-stuhackathon-frontend"

# Azure AD Configuration
$CLIENT_ID = "dd26d38d-bb41-445d-8aca-8bc7fc4215d3"
$TENANT_ID = "1d7732d9-fbce-4d25-9f2c-383014239b09"
$APP_URL = "https://app-stuhackathon-frontend.redisland-998a235a.eastus.azurecontainerapps.io"
$FABRIC_URL = "https://eahwkwofgcjezhp7nh5wnq4s5a-o34ofvdhaj5ebaa6wlkzsqexdy.datawarehouse.fabric.microsoft.com"

Write-Host "Building Docker image with Azure AD configuration..." -ForegroundColor Cyan

Set-Location frontend

az acr build --registry $REGISTRY `
  --image $IMAGE_NAME `
  --file Dockerfile . `
  --build-arg VITE_AZURE_CLIENT_ID="$CLIENT_ID" `
  --build-arg VITE_AZURE_AUTHORITY="https://login.microsoftonline.com/$TENANT_ID" `
  --build-arg VITE_REDIRECT_URI="$APP_URL" `
  --build-arg VITE_POST_LOGOUT_REDIRECT_URI="$APP_URL" `
  --build-arg VITE_FABRIC_AGENT_API_URL="$FABRIC_URL" `
  --build-arg VITE_FUNCTIONS_API_URL="http://localhost:7071/api/chat"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDocker image built successfully!" -ForegroundColor Green
    Write-Host "`nDeploying to Azure Container App..." -ForegroundColor Cyan
    
    Set-Location ..
    
    az containerapp update `
      --name $APP_NAME `
      --resource-group $RESOURCE_GROUP `
      --image "$REGISTRY.azurecr.io/$IMAGE_NAME"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDeployment successful!" -ForegroundColor Green
        Write-Host "`nApplication URL: $APP_URL" -ForegroundColor Yellow
        Write-Host "`nWait a few moments for the new revision to become active, then test the app." -ForegroundColor Yellow
    } else {
        Write-Host "`nDeployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "`nDocker build failed!" -ForegroundColor Red
}
