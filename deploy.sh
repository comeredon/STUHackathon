#!/bin/bash

# STUHackathon Deployment Script with Managed Identity
# Deploys both backend API and frontend to Azure Container Apps

set -e  # Exit on error

echo "🚀 STUHackathon Deployment to Azure Container Apps"
echo "================================================="
echo ""

# Login to Azure
echo "📝 Logging in to Azure..."
az login

echo ""
echo "📋 Please provide deployment configuration:"
echo ""

# Prompt for resource group (where Azure AI Foundry is deployed)
read -p "Enter Resource Group name (where Foundry is deployed): " RESOURCE_GROUP
if [ -z "$RESOURCE_GROUP" ]; then
  echo "❌ Error: Resource group is required"
  exit 1
fi

# Verify resource group exists
if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
  echo "❌ Error: Resource group '$RESOURCE_GROUP' does not exist"
  exit 1
fi

# Get location from existing resource group
LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location --output tsv)
echo "✅ Using location: $LOCATION"

# Prompt for other configuration
read -p "Enter Container Registry name (will be created if not exists) [acrstuhackathon]: " CONTAINER_REGISTRY
CONTAINER_REGISTRY=${CONTAINER_REGISTRY:-acrstuhackathon}

read -p "Enter Container Apps Environment name [env-stuhackathon]: " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-env-stuhackathon}

read -p "Enter Azure AI Foundry endpoint: " FOUNDRY_ENDPOINT
if [ -z "$FOUNDRY_ENDPOINT" ]; then
  echo "❌ Error: Foundry endpoint is required"
  exit 1
fi

read -p "Enter Foundry Project ID: " FOUNDRY_PROJECT_ID
if [ -z "$FOUNDRY_PROJECT_ID" ]; then
  echo "❌ Error: Foundry Project ID is required"
  exit 1
fi

read -p "Enter Foundry Agent ID: " FOUNDRY_AGENT_ID
if [ -z "$FOUNDRY_AGENT_ID" ]; then
  echo "❌ Error: Foundry Agent ID is required"
  exit 1
fi

read -p "Enter Azure AI Foundry resource name: " FOUNDRY_RESOURCE_NAME
if [ -z "$FOUNDRY_RESOURCE_NAME" ]; then
  echo "❌ Error: Foundry resource name is required (e.g., aif-multiagentkuy2y)"
  exit 1
fi

read -p "Enter Azure Tenant ID: " AZURE_TENANT_ID
if [ -z "$AZURE_TENANT_ID" ]; then
  echo "❌ Error: Azure Tenant ID is required"
  exit 1
fi

read -p "Enter Azure Client ID (frontend app registration): " AZURE_CLIENT_ID
if [ -z "$AZURE_CLIENT_ID" ]; then
  echo "❌ Error: Azure Client ID is required"
  exit 1
fi

# App names
read -p "Enter Backend API app name [app-stuhackathon-api]: " API_APP_NAME
API_APP_NAME=${API_APP_NAME:-app-stuhackathon-api}

read -p "Enter Frontend app name [app-stuhackathon-frontend]: " FRONTEND_APP_NAME
FRONTEND_APP_NAME=${FRONTEND_APP_NAME:-app-stuhackathon-frontend}

echo ""
echo "📋 Configuration Summary:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Container Registry: $CONTAINER_REGISTRY"
echo "  Environment: $ENVIRONMENT"
echo "  Backend API: $API_APP_NAME"
echo "  Frontend: $FRONTEND_APP_NAME"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Deployment cancelled."
  exit 0
fi

echo ""
echo "🚀 Starting deployment..."

# Create Container Registry if it doesn't exist
echo "🐳 Checking Azure Container Registry..."
if az acr show --name $CONTAINER_REGISTRY --resource-group $RESOURCE_GROUP &>/dev/null; then
  echo "✅ Container Registry '$CONTAINER_REGISTRY' already exists"
else
  echo "📦 Creating Azure Container Registry..."
  az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $CONTAINER_REGISTRY \
    --sku Basic \
    --admin-enabled false
fi

# Create Container Apps Environment if it doesn't exist
echo "🏭 Checking Container Apps Environment..."
if az containerapp env show --name $ENVIRONMENT --resource-group $RESOURCE_GROUP &>/dev/null; then
  echo "✅ Container Apps Environment '$ENVIRONMENT' already exists"
else
  echo "📦 Creating Container Apps Environment..."
  az containerapp env create \
    --name $ENVIRONMENT \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --enable-workload-profiles false
  
  echo "⏳ Waiting for environment to be ready..."
  sleep 30
fi

# Build and push API image
echo "🔨 Building backend API image..."
cd api
az acr build \
  --registry $CONTAINER_REGISTRY \
  --image stuhackathon-api:latest \
  --file Dockerfile \
  .
cd ..

# Build and push frontend image
echo "🔨 Building frontend image..."
cd frontend
az acr build \
  --registry $CONTAINER_REGISTRY \
  --image stuhackathon-frontend:latest \
  --file Dockerfile \
  .
cd ..

# Deploy Backend API with Managed Identity
echo "🚀 Deploying backend API..."
az containerapp create \
  --name $API_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $CONTAINER_REGISTRY.azurecr.io/stuhackathon-api:latest \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --registry-server $CONTAINER_REGISTRY.azurecr.io \
  --system-assigned \
  --env-vars \
    NODE_ENV=production \
    PORT=3000 \
    FOUNDRY_ENDPOINT=$FOUNDRY_ENDPOINT \
    FOUNDRY_PROJECT_ID=$FOUNDRY_PROJECT_ID \
    FOUNDRY_AGENT_ID=$FOUNDRY_AGENT_ID \
    USE_MANAGED_IDENTITY=true \
    AZURE_TENANT_ID=$AZURE_TENANT_ID \
    ALLOWED_ORIGINS=https://$FRONTEND_APP_NAME.*.azurecontainerapps.io

# Get the API FQDN
API_FQDN=$(az containerapp show \
  --name $API_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

echo "✅ Backend API deployed: https://$API_FQDN"

# Deploy Frontend
echo "🚀 Deploying frontend..."
az containerapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $CONTAINER_REGISTRY.azurecr.io/stuhackathon-frontend:latest \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --registry-server $CONTAINER_REGISTRY.azurecr.io

# Get the frontend FQDN
FRONTEND_FQDN=$(az containerapp show \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

echo "✅ Frontend deployed: https://$FRONTEND_FQDN"

# Get the Managed Identity Principal ID
echo "🔐 Retrieving Managed Identity..."
PRINCIPAL_ID=$(az containerapp show \
  --name $API_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query identity.principalId \
  --output tsv)

if [ -z "$PRINCIPAL_ID" ]; then
  echo "❌ Error: Failed to retrieve Managed Identity Principal ID"
  exit 1
fi

echo "✅ Managed Identity Principal ID: $PRINCIPAL_ID"

# Get current subscription ID
SUBSCRIPTION_ID=$(az account show --query id --output tsv)
echo "📋 Using Subscription: $SUBSCRIPTION_ID"

# Assign Cognitive Services User role to Managed Identity
echo "🔐 Assigning 'Cognitive Services User' role to Managed Identity..."
FOUNDRY_SCOPE="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.CognitiveServices/accounts/$FOUNDRY_RESOURCE_NAME"

if az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Cognitive Services User" \
  --scope $FOUNDRY_SCOPE &>/dev/null; then
  echo "✅ Successfully assigned 'Cognitive Services User' role on Foundry"
else
  echo "⚠️  Warning: Failed to assign Cognitive Services User role. It may already exist or you may lack permissions."
  echo "   Manual assignment may be required: az role assignment create --assignee $PRINCIPAL_ID --role 'Cognitive Services User' --scope $FOUNDRY_SCOPE"
fi

# Assign ACR Pull role to Managed Identity
echo "🔐 Assigning 'AcrPull' role to Managed Identity..."
ACR_SCOPE="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerRegistry/registries/$CONTAINER_REGISTRY"

if az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "AcrPull" \
  --scope $ACR_SCOPE &>/dev/null; then
  echo "✅ Successfully assigned 'AcrPull' role on Container Registry"
else
  echo "⚠️  Warning: Failed to assign AcrPull role. It may already exist or you may lack permissions."
fi

echo ""
echo "⏳ Waiting for role assignments to propagate (30 seconds)..."
sleep 30

echo ""
echo "⚠️  IMPORTANT: Complete these manual steps:"
echo ""
echo "1. Update Azure AD app registration redirect URIs:"
echo "   - Go to Azure Portal > Azure AD > App Registrations"
echo "   - Select your app (Client ID: $AZURE_CLIENT_ID)"
echo "   - Add redirect URI: https://$FRONTEND_FQDN"
echo "   - Add redirect URI: https://$FRONTEND_FQDN/.auth/login/aad/callback"
echo ""
echo "2. Verify Foundry Managed Identity has access to Fabric workspace:"
echo "   - Ensure the Foundry resource's Managed Identity has 'Contributor' role on Fabric workspace"
echo ""
echo "✅ Deployment complete!"

echo "📋 Summary:"
echo "  Backend API: https://$API_FQDN"
echo "  Frontend:    https://$FRONTEND_FQDN"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Managed Identity: $PRINCIPAL_ID"
