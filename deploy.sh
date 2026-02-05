#!/bin/bash

# STUHackathon Deployment Script with Managed Identity
# Deploys both backend API and frontend to Azure Container Apps

set -e  # Exit on error

echo "🚀 STUHackathon Deployment to Azure Container Apps"
echo "================================================="
echo ""

# Configuration file path
CONFIG_FILE=".deployment-config.json"

# Function to load saved configuration
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        echo "📂 Found saved configuration from previous deployment"
        return 0
    fi
    return 1
}

# Function to get config value
get_config_value() {
    local key=$1
    if [ -f "$CONFIG_FILE" ]; then
        jq -r ".$key // empty" "$CONFIG_FILE" 2>/dev/null || echo ""
    else
        echo ""
    fi
}

# Function to save configuration
save_config() {
    cat > "$CONFIG_FILE" << EOF
{
  "resourceGroup": "$RESOURCE_GROUP",
  "location": "$LOCATION",
  "foundryEndpoint": "$FOUNDRY_ENDPOINT",
  "foundryResourceName": "$FOUNDRY_RESOURCE_NAME",
  "foundryProjectId": "$FOUNDRY_PROJECT_ID",
  "foundryAgentId": "$FOUNDRY_AGENT_ID",
  "azureClientId": "$AZURE_CLIENT_ID",
  "containerRegistry": "$CONTAINER_REGISTRY",
  "environment": "$ENVIRONMENT",
  "apiAppName": "$API_APP_NAME",
  "frontendAppName": "$FRONTEND_APP_NAME",
  "lastDeployment": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF
    echo "💾 Configuration saved for next deployment"
}

# Function to read with default
read_with_default() {
    local prompt=$1
    local default=$2
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        echo "${value:-$default}"
    else
        read -p "$prompt: " value
        echo "$value"
    fi
}

# Login to Azure
echo "📝 Logging in to Azure..."
az login

echo ""
echo "📋 Configuration:"
echo ""

# Load previous configuration if available
if load_config; then
    echo "💡 Using saved configuration as defaults (press Enter to accept)"
    echo ""
fi

# Prompt for resource group with saved default
SAVED_RG=$(get_config_value "resourceGroup")
RESOURCE_GROUP=$(read_with_default "Enter Resource Group name" "$SAVED_RG")
if [ -z "$RESOURCE_GROUP" ]; then
  echo "❌ Error: Resource group is required"
  exit 1
fi

# Verify resource group exists or create it
if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
  echo "📦 Resource group '$RESOURCE_GROUP' does not exist."
  SAVED_LOCATION=$(get_config_value "location")
  LOCATION=$(read_with_default "Enter location to create it (e.g., eastus)" "$SAVED_LOCATION")
  if [ -z "$LOCATION" ]; then
    echo "❌ Error: Location is required to create resource group"
    exit 1
  fi
  echo "📦 Creating resource group..."
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
fi

# Get location from resource group
LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location --output tsv)
echo "✅ Using location: $LOCATION"

# Auto-discover Azure AI Foundry resource
echo "🔍 Discovering Azure AI Foundry resource..."
FOUNDRY_RESOURCE=$(az cognitiveservices account list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?kind=='AIServices' || kind=='CognitiveServices'].{name:name,endpoint:properties.endpoint}" \
  --output json 2>/dev/null | jq -r '.[0]')

if [ "$FOUNDRY_RESOURCE" != "null" ] && [ -n "$FOUNDRY_RESOURCE" ]; then
  FOUNDRY_RESOURCE_NAME=$(echo $FOUNDRY_RESOURCE | jq -r '.name')
  FOUNDRY_ENDPOINT=$(echo $FOUNDRY_RESOURCE | jq -r '.endpoint')
  echo "✅ Found Foundry resource: $FOUNDRY_RESOURCE_NAME"
  echo "✅ Endpoint: $FOUNDRY_ENDPOINT"
  
  # Prompt for project and agent IDs with defaults
  SAVED_PROJECT_ID=$(get_config_value "foundryProjectId")
  FOUNDRY_PROJECT_ID=$(read_with_default "Enter Foundry Project ID" "${SAVED_PROJECT_ID:-proj-default}")
  
  SAVED_AGENT_ID=$(get_config_value "foundryAgentId")
  FOUNDRY_AGENT_ID=$(read_with_default "Enter Foundry Agent ID" "${SAVED_AGENT_ID:-Agent-Data}")
else
  echo "⚠️  No Azure AI Foundry resource found in this resource group."
  SAVED_ENDPOINT=$(get_config_value "foundryEndpoint")
  FOUNDRY_ENDPOINT=$(read_with_default "Enter Foundry endpoint URL" "$SAVED_ENDPOINT")
  
  SAVED_RESOURCE_NAME=$(get_config_value "foundryResourceName")
  FOUNDRY_RESOURCE_NAME=$(read_with_default "Enter Foundry resource name" "$SAVED_RESOURCE_NAME")
  
  SAVED_PROJECT_ID=$(get_config_value "foundryProjectId")
  FOUNDRY_PROJECT_ID=$(read_with_default "Enter Foundry Project ID" "$SAVED_PROJECT_ID")
  
  SAVED_AGENT_ID=$(get_config_value "foundryAgentId")
  FOUNDRY_AGENT_ID=$(read_with_default "Enter Foundry Agent ID" "$SAVED_AGENT_ID")
fi

# Auto-discover tenant ID from current login
AZURE_TENANT_ID=$(az account show --query tenantId --output tsv)
echo "✅ Using Tenant ID: $AZURE_TENANT_ID"

# Auto-discover or prompt for Azure AD app registration with saved default
echo "🔍 Looking for Azure AD app registrations..."
DISCOVERED_CLIENT_ID=$(az ad app list --show-mine --query "[0].appId" --output tsv 2>/dev/null)
SAVED_CLIENT_ID=$(get_config_value "azureClientId")

# Use saved value if available, otherwise discovered value
DEFAULT_CLIENT_ID="${SAVED_CLIENT_ID:-$DISCOVERED_CLIENT_ID}"

if [ -n "$DEFAULT_CLIENT_ID" ] && [ "$DEFAULT_CLIENT_ID" != "null" ]; then
  echo "💡 Found saved/discovered Azure AD app: $DEFAULT_CLIENT_ID"
  AZURE_CLIENT_ID=$(read_with_default "Enter Azure AD Client ID (app registration)" "$DEFAULT_CLIENT_ID")
else
  read -p "Enter Azure AD Client ID (app registration): " AZURE_CLIENT_ID
fi

# Set default names
CONTAINER_REGISTRY="acr${RESOURCE_GROUP//[^a-zA-Z0-9]/}"
CONTAINER_REGISTRY=${CONTAINER_REGISTRY:0:50}  # ACR name max 50 chars
ENVIRONMENT="env-stuhackathon"
API_APP_NAME="app-stuhackathon-api"
FRONTEND_APP_NAME="app-stuhackathon-frontend"

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
az acr build \
  --registry $CONTAINER_REGISTRY \
  --image stuhackathon-api:latest \
  --file api/Dockerfile \
  --platform linux \
  api

# Build and push frontend image
echo "🔨 Building frontend image..."
az acr build \
  --registry $CONTAINER_REGISTRY \
  --image stuhackathon-frontend:latest \
  --file frontend/Dockerfile \
  --platform linux \
  frontend

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

# Save configuration for next time
save_config

echo ""
echo "💡 Configuration saved! Next deployment will use these values as defaults."
echo "2. Verify Foundry Managed Identity has access to Fabric workspace:"
echo "   - Ensure the Foundry resource's Managed Identity has 'Contributor' role on Fabric workspace"
echo ""
echo "✅ Deployment complete!"

echo "📋 Summary:"
echo "  Backend API: https://$API_FQDN"
echo "  Frontend:    https://$FRONTEND_FQDN"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Managed Identity: $PRINCIPAL_ID"
