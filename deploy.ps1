# STUHackathon Deployment Script with Managed Identity (PowerShell)
# Deploys both backend API and frontend to Azure Container Apps

Write-Host "🚀 STUHackathon Deployment to Azure Container Apps" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Login to Azure
Write-Host "📝 Logging in to Azure..." -ForegroundColor Cyan
az login

Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host ""

# Prompt for resource group only
$RESOURCE_GROUP = Read-Host "Enter Resource Group name"
if ([string]::IsNullOrWhiteSpace($RESOURCE_GROUP)) {
    Write-Host "❌ Error: Resource group is required" -ForegroundColor Red
    exit 1
}

# Verify resource group exists or create it
$rgExists = az group show --name $RESOURCE_GROUP 2>$null
if (-not $rgExists) {
    Write-Host "📦 Resource group '$RESOURCE_GROUP' does not exist." -ForegroundColor Yellow
    $LOCATION = Read-Host "Enter location to create it (e.g., eastus)"
    if ([string]::IsNullOrWhiteSpace($LOCATION)) {
        Write-Host "❌ Error: Location is required to create resource group" -ForegroundColor Red
        exit 1
    }
    Write-Host "📦 Creating resource group..." -ForegroundColor Cyan
    az group create --name $RESOURCE_GROUP --location $LOCATION
}

# Get location from resource group
$LOCATION = az group show --name $RESOURCE_GROUP --query location --output tsv
Write-Host "✅ Using location: $LOCATION" -ForegroundColor Green

# Auto-discover Azure AI Foundry resource
Write-Host "🔍 Discovering Azure AI Foundry resource..." -ForegroundColor Cyan
$foundryJson = az cognitiveservices account list `
  --resource-group $RESOURCE_GROUP `
  --query "[?kind=='AIServices' || kind=='CognitiveServices'].{name:name,endpoint:properties.endpoint}" `
  --output json 2>$null

if ($foundryJson) {
    $foundryResource = $foundryJson | ConvertFrom-Json | Select-Object -First 1
    if ($foundryResource) {
        $FOUNDRY_RESOURCE_NAME = $foundryResource.name
        $FOUNDRY_ENDPOINT = $foundryResource.endpoint
        Write-Host "✅ Found Foundry resource: $FOUNDRY_RESOURCE_NAME" -ForegroundColor Green
        Write-Host "✅ Endpoint: $FOUNDRY_ENDPOINT" -ForegroundColor Green
        
        # Prompt for project and agent IDs
        $input = Read-Host "Enter Foundry Project ID [proj-default]"
        $FOUNDRY_PROJECT_ID = if ([string]::IsNullOrWhiteSpace($input)) { "proj-default" } else { $input }
        
        $input = Read-Host "Enter Foundry Agent ID [Agent-Data]"
        $FOUNDRY_AGENT_ID = if ([string]::IsNullOrWhiteSpace($input)) { "Agent-Data" } else { $input }
    }
} else {
    Write-Host "⚠️  No Azure AI Foundry resource found in this resource group." -ForegroundColor Yellow
    $FOUNDRY_ENDPOINT = Read-Host "Enter Foundry endpoint URL"
    $FOUNDRY_RESOURCE_NAME = Read-Host "Enter Foundry resource name"
    $FOUNDRY_PROJECT_ID = Read-Host "Enter Foundry Project ID"
    $FOUNDRY_AGENT_ID = Read-Host "Enter Foundry Agent ID"
}

# Auto-discover tenant ID from current login
$AZURE_TENANT_ID = az account show --query tenantId --output tsv
Write-Host "✅ Using Tenant ID: $AZURE_TENANT_ID" -ForegroundColor Green

# Auto-discover or prompt for Azure AD app registration
Write-Host "🔍 Looking for Azure AD app registrations..." -ForegroundColor Cyan
$AZURE_CLIENT_ID = az ad app list --show-mine --query "[0].appId" --output tsv 2>$null
if ($AZURE_CLIENT_ID -and $AZURE_CLIENT_ID -ne "null") {
    Write-Host "✅ Found Azure AD app: $AZURE_CLIENT_ID" -ForegroundColor Green
    $useApp = Read-Host "Use this app registration? (y/n) [y]"
    if ($useApp -eq 'n' -or $useApp -eq 'N') {
        $AZURE_CLIENT_ID = Read-Host "Enter Azure AD Client ID"
    }
} else {
    $AZURE_CLIENT_ID = Read-Host "Enter Azure AD Client ID (app registration)"
}

# Set default names
$CONTAINER_REGISTRY = "acr" + ($RESOURCE_GROUP -replace '[^a-zA-Z0-9]','')
$CONTAINER_REGISTRY = $CONTAINER_REGISTRY.Substring(0, [Math]::Min(50, $CONTAINER_REGISTRY.Length))  # ACR name max 50 chars
$ENVIRONMENT = "env-stuhackathon"
$API_APP_NAME = "app-stuhackathon-api"
$FRONTEND_APP_NAME = "app-stuhackathon-frontend"

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
