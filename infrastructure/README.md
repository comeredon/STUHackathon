# Infrastructure as Code

Infrastructure definitions for Azure resources.

## Options

### Bicep (Recommended)

```bash
az deployment group create \
  --resource-group rg-stuhackathon-dev \
  --template-file main.bicep \
  --parameters main.parameters.json
```

### Terraform

```bash
terraform init
terraform plan
terraform apply
```

## Resources Defined

- Azure OpenAI Service
- Azure Cosmos DB
- Azure Container Registry
- Azure Container Apps Environment
- Azure Function App
- Application Insights
- Managed Identities
