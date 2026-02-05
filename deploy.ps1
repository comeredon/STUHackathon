# STUHackathon Deployment Script with Managed Identity (PowerShell)
# Deploys both backend API and frontend to Azure Container Apps

Write-Host "🚀 STUHackathon Deployment to Azure Container Apps" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Login to Azure
Write-Host "📝 Logging in to Azure..." -ForegroundColor Cyan
az login

Write-Host ""
Write-Host "📋 Please provide deployment configuration:" -ForegroundColor Cyan
Write-Host ""

# Prompt for resource group (where Azure AI Foundry is deployed)
$RESOURCE_GROUP = Read-Host "Enter Resource Group name (where Foundry is deployed)"
if ([string]::IsNullOrWhiteSpace($RESOURCE_GROUP)) {
    Write-Host "❌ Error: Resource group is required" -ForegroundColor Red
    exit 1
}

# Verify resource group exists
$rgExists = az group show --name $RESOURCE_GROUP 2>$null
if (-not $rgExists) {
    Write-Host "❌ Error: Resource group '$RESOURCE_GROUP' does not exist" -ForegroundColor Red
    exit 1
}

# Get location from existing resource group
$LOCATION = az group show --name $RESOURCE_GROUP --query location --output tsv
Write-Host "✅ Using location: $LOCATION" -ForegroundColor Green

# Prompt for other configuration
$inputRegistry = Read-Host "Enter Container Registry name (will be created if not exists) [acrstuhackathon]"
$CONTAINER_REGISTRY = if ([string]::IsNullOrWhiteSpace($inputRegistry)) { "acrstuhackathon" } else { $inputRegistry }

$inputEnv = Read-Host "Enter Container Apps Environment name [env-stuhackathon]"
$ENVIRONMENT = if ([string]::IsNullOrWhiteSpace($inputEnv)) { "env-stuhackathon" } else { $inputEnv }

$FOUNDRY_ENDPOINT = Read-Host "Enter Azure AI Foundry endpoint"
if ([string]::IsNullOrWhiteSpace($FOUNDRY_ENDPOINT)) {
    Write-Host "❌ Error: Foundry endpoint is required" -ForegroundColor Red
    exit 1
}

$FOUNDRY_PROJECT_ID = Read-Host "Enter Foundry Project ID"
if ([string]::IsNullOrWhiteSpace($FOUNDRY_PROJECT_ID)) {
    Write-Host "❌ Error: Foundry Project ID is required" -ForegroundColor Red
    exit 1
}

$FOUNDRY_AGENT_ID = Read-Host "Enter Foundry Agent ID"
if ([string]::IsNullOrWhiteSpace($FOUNDRY_AGENT_ID)) {
    Write-Host "❌ Error: Foundry Agent ID is required" -ForegroundColor Red
    exit 1
}

$FOUNDRY_RESOURCE_NAME = Read-Host "Enter Azure AI Foundry resource name"
if ([string]::IsNullOrWhiteSpace($FOUNDRY_RESOURCE_NAME)) {
    Write-Host "❌ Error: Foundry resource name is required (e.g., aif-multiagentkuy2y)" -ForegroundColor Red
    exit 1
}

$AZURE_TENANT_ID = Read-Host "Enter Azure Tenant ID"
if ([string]::IsNullOrWhiteSpace($AZURE_TENANT_ID)) {
    Write-Host "❌ Error: Azure Tenant ID is required" -ForegroundColor Red
    exit 1
}

$AZURE_CLIENT_ID = Read-Host "Enter Azure Client ID (frontend app registration)"
if ([string]::IsNullOrWhiteSpace($AZURE_CLIENT_ID)) {
    Write-Host "❌ Error: Azure Client ID is required" -ForegroundColor Red
    exit 1
}

# App names
$inputApiName = Read-Host "Enter Backend API app name [app-stuhackathon-api]"
$API_APP_NAME = if ([string]::IsNullOrWhiteSpace($inputApiName)) { "app-stuhackathon-api" } else { $inputApiName }

$inputFrontendName = Read-Host "Enter Frontend app name [app-stuhackathon-frontend]"
$FRONTEND_APP_NAME = if ([string]::IsNullOrWhiteSpace($inputFrontendName)) { "app-stuhackathon-frontend" } else { $inputFrontendName }

Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "  Resource Group: $RESOURCE_GROUP" -ForegroundColor White
Write-Host "  Location: $LOCATION" -ForegroundColor White
Write-Host "  Container Registry: $CONTAINER_REGISTRY" -ForegroundColor White
Write-Host "  Environment: $ENVIRONMENT" -ForegroundColor White
Write-Host "  Backend API: $API_APP_NAME" -ForegroundColor White
Write-Host "  Frontend: $FRONTEND_APP_NAME" -ForegroundColor White
Write-Host ""
$confirmation = Read-Host "Continue with deployment? (y/n)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting deployment..." -ForegroundColor Green

# Create Container Registry if it doesn't exist
Write-Host "🐳 Checking Azure Container Registry..." -ForegroundColor Cyan
$acrExists = az acr show --name $CONTAINER_REGISTRY --resource-group $RESOURCE_GROUP 2>$null
if ($acrExists) {
    Write-Host "✅ Container Registry '$CONTAINER_REGISTRY' already exists" -ForegroundColor Green
} else {
    Write-Host "📦 Creating Azure Container Registry..." -ForegroundColor Cyan
    az acr create `
      --resource-group $RESOURCE_GROUP `
      --name $CONTAINER_REGISTRY `
      --sku Basic `
      --admin-enabled false
}

# Create Container Apps Environment if it doesn't exist
Write-Host "🏭 Checking Container Apps Environment..." -ForegroundColor Cyan
$envExists = az containerapp env show --name $ENVIRONMENT --resource-group $RESOURCE_GROUP 2>$null
if ($envExists) {
    Write-Host "✅ Container Apps Environment '$ENVIRONMENT' already exists" -ForegroundColor Green
} else {
    Write-Host "📦 Creating Container Apps Environment..." -ForegroundColor Cyan
    az containerapp env create `
      --name $ENVIRONMENT `
      --resource-group $RESOURCE_GROUP `
      --location $LOCATION `
      --enable-workload-profiles false

    Write-Host "⏳ Waiting for environment to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

# Build and push API image
Write-Host "🔨 Building backend API image..." -ForegroundColor Cyan
Set-Location -Path api
az acr build `
  --registry $CONTAINER_REGISTRY `
  --image stuhackathon-api:latest `
  --file Dockerfile `
  .
Set-Location -Path ..

# Build and push frontend image
Write-Host "🔨 Building frontend image..." -ForegroundColor Cyan
Set-Location -Path frontend
az acr build `
  --registry $CONTAINER_REGISTRY `
  --image stuhackathon-frontend:latest `
  --file Dockerfile `
  .
Set-Location -Path ..

# Deploy Backend API with Managed Identity
Write-Host "🚀 Deploying backend API..." -ForegroundColor Cyan
az containerapp create `
  --name $API_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --environment $ENVIRONMENT `
  --image "$CONTAINER_REGISTRY.azurecr.io/stuhackathon-api:latest" `
  --target-port 3000 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3 `
  --cpu 0.5 `
  --memory 1Gi `
  --registry-server "$CONTAINER_REGISTRY.azurecr.io" `
  --system-assigned `
  --env-vars `
    NODE_ENV=production `
    PORT=3000 `
    FOUNDRY_ENDPOINT=$FOUNDRY_ENDPOINT `
    FOUNDRY_PROJECT_ID=$FOUNDRY_PROJECT_ID `
    FOUNDRY_AGENT_ID=$FOUNDRY_AGENT_ID `
    USE_MANAGED_IDENTITY=true `
    AZURE_TENANT_ID=$AZURE_TENANT_ID `
    ALLOWED_ORIGINS="https://$FRONTEND_APP_NAME.*.azurecontainerapps.io"

# Get the API FQDN
$API_FQDN = az containerapp show `
  --name $API_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query properties.configuration.ingress.fqdn `
  --output tsv

Write-Host "✅ Backend API deployed: https://$API_FQDN" -ForegroundColor Green

# Deploy Frontend
Write-Host "🚀 Deploying frontend..." -ForegroundColor Cyan
az containerapp create `
  --name $FRONTEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --environment $ENVIRONMENT `
  --image "$CONTAINER_REGISTRY.azurecr.io/stuhackathon-frontend:latest" `
  --target-port 80 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3 `
  --cpu 0.25 `
  --memory 0.5Gi `
  --registry-server "$CONTAINER_REGISTRY.azurecr.io"

# Get the frontend FQDN
$FRONTEND_FQDN = az containerapp show `
  --name $FRONTEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query properties.configuration.ingress.fqdn `
  --output tsv

Write-Host "✅ Frontend deployed: https://$FRONTEND_FQDN" -ForegroundColor Green

# Get the Managed Identity Principal ID
Write-Host "🔐 Retrieving Managed Identity..." -ForegroundColor Cyan
$PRINCIPAL_ID = az containerapp show `
  --name $API_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query identity.principalId `
  --output tsv

if ([string]::IsNullOrWhiteSpace($PRINCIPAL_ID)) {
    Write-Host "❌ Error: Failed to retrieve Managed Identity Principal ID" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Managed Identity Principal ID: $PRINCIPAL_ID" -ForegroundColor Green

# Get current subscription ID
$SUBSCRIPTION_ID = az account show --query id --output tsv
Write-Host "📋 Using Subscription: $SUBSCRIPTION_ID" -ForegroundColor Cyan

# Assign Cognitive Services User role to Managed Identity
Write-Host "🔐 Assigning 'Cognitive Services User' role to Managed Identity..." -ForegroundColor Cyan
$FOUNDRY_SCOPE = "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.CognitiveServices/accounts/$FOUNDRY_RESOURCE_NAME"

$roleAssignment = az role assignment create `
  --assignee $PRINCIPAL_ID `
  --role "Cognitive Services User" `
  --scope $FOUNDRY_SCOPE 2>$null

if ($roleAssignment) {
    Write-Host "✅ Successfully assigned 'Cognitive Services User' role on Foundry" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Failed to assign Cognitive Services User role. It may already exist or you may lack permissions." -ForegroundColor Yellow
    Write-Host "   Manual assignment may be required." -ForegroundColor Yellow
}

# Assign ACR Pull role to Managed Identity
Write-Host "🔐 Assigning 'AcrPull' role to Managed Identity..." -ForegroundColor Cyan
$ACR_SCOPE = "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerRegistry/registries/$CONTAINER_REGISTRY"

$acrRoleAssignment = az role assignment create `
  --assignee $PRINCIPAL_ID `
  --role "AcrPull" `
  --scope $ACR_SCOPE 2>$null

if ($acrRoleAssignment) {
    Write-Host "✅ Successfully assigned 'AcrPull' role on Container Registry" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Failed to assign AcrPull role. It may already exist or you may lack permissions." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "⏳ Waiting for role assignments to propagate (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "⚠️  IMPORTANT: Complete these manual steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Update Azure AD app registration redirect URIs:" -ForegroundColor Cyan
Write-Host "   - Go to Azure Portal > Azure AD > App Registrations" -ForegroundColor White
Write-Host "   - Select your app (Client ID: $AZURE_CLIENT_ID)" -ForegroundColor White
Write-Host "   - Add redirect URI: https://$FRONTEND_FQDN" -ForegroundColor White
Write-Host "   - Add redirect URI: https://$FRONTEND_FQDN/.auth/login/aad/callback" -ForegroundColor White
Write-Host ""
Write-Host "2. Verify Foundry Managed Identity has access to Fabric workspace:" -ForegroundColor Cyan
Write-Host "   - Ensure the Foundry resource's Managed Identity has 'Contributor' role on Fabric workspace" -ForegroundColor White
Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  Backend API: https://$API_FQDN" -ForegroundColor White
Write-Host "  Frontend:    https://$FRONTEND_FQDN" -ForegroundColor White
Write-Host "  Resource Group: $RESOURCE_GROUP" -ForegroundColor White
Write-Host "  Managed Identity: $PRINCIPAL_ID" -ForegroundColor White
