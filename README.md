# STUHackathon - Azure AI Chatbot for Fabric with Managed Identity

An intelligent chatbot application that converts natural language questions into SQL queries for Microsoft Fabric Lakehouse, featuring **keyless authentication** with Managed Identity and On-Behalf-Of (OBO) flow.

## 🚀 Overview

This project demonstrates a modern, secure cloud-native architecture for building AI-powered chatbots that can query data warehouses using natural language. Users authenticate with Azure AD, and the application maintains user context throughout the request chain using OBO flow—**no API keys required**.

### Key Features

- 🔐 **Keyless Architecture**: Managed Identity + On-Behalf-Of flow (no API keys)
- 👤 **User Context Preservation**: Maintains user identity through Azure AI Foundry
- 🤖 **Azure AI Foundry Integration**: Native Fabric data agent capabilities
- 💬 **Conversation Threads**: Stateful conversations managed by Foundry
- 🐳 **Containerized**: Both frontend and backend on Azure Container Apps
- 📊 **Microsoft Fabric Integration**: Direct Lakehouse query execution
- 🔒 **Security Best Practices**: RBAC, rate limiting, CORS, audit logging

## 🏗️ Architecture

```
User (Browser)
  ↓ Azure AD Authentication
Frontend (React SPA in Container Apps)
  ↓ User Bearer Token
Backend API (Node.js in Container Apps with Managed Identity)
  ↓ On-Behalf-Of (OBO) Flow
Azure AI Foundry (with Fabric Data Agent)
  ↓ Managed Identity
Microsoft Fabric Lakehouse
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Chat UI with Azure AD auth |
| **Backend API** | Node.js + Express + TypeScript | OBO flow coordinator, no keys |
| **Authentication** | Azure AD (MSAL) | User authentication |
| **AI Service** | Azure AI Foundry | Managed AI agent platform |
| **Data Agent** | Fabric Data Agent | Natural language to SQL |
| **Data Warehouse** | Microsoft Fabric Lakehouse | SQL endpoint for data queries |
| **Identity** | Managed Identity | Keyless Azure service auth |
| **Hosting** | Azure Container Apps | Scalable container platform |

## 📋 Prerequisites

- Azure Subscription
- GitHub Account
- Microsoft Fabric Workspace with Lakehouse
- Azure AI Foundry project with Fabric data agent enabled
- Node.js 18+ and npm
- Docker Desktop
- Azure CLI

## 🎯 Quick Start

### Option 1: Deploy to Azure (Recommended)

```bash
# Clone repository
git clone https://github.com/comeredon/STUHackathon.git
cd STUHackathon

# Run deployment script (will prompt for configuration)
chmod +x deploy.sh
./deploy.sh
```

The script will prompt you for:
- Resource group name (where Azure AI Foundry is deployed)
- Azure AI Foundry details (endpoint, project ID, agent ID, resource name)
- Azure AD configuration (tenant ID, client ID)
- Container registry and app names

The script will **automatically**:
- ✅ Create Container Registry and Container Apps Environment
- ✅ Build and deploy both backend and frontend containers
- ✅ Enable system-assigned Managed Identity on backend API
- ✅ Assign "Cognitive Services User" role to connect to Foundry
- ✅ Assign "AcrPull" role for container image pulling
- ✅ Configure environment variables with Foundry connection details

See [Managed Identity Setup Guide](docs/MANAGED_IDENTITY_SETUP.md) for detailed instructions.

### Option 2: Local Development

**Backend API:**
```bash
cd api
npm install
cp .env.example .env
# Edit .env with your Azure AI Foundry details
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Azure AD app details
npm run dev
```

## 🔐 Security Model

### Keyless Authentication Flow

1. **User Authentication** - User signs in with Azure AD via MSAL
2. **Token Forwarding** - Frontend sends user token to backend API
3. **On-Behalf-Of Exchange** - Backend uses Managed Identity to exchange user token for Foundry token
4. **Azure AI Foundry Call** - Backend calls Foundry with delegated user permissions
5. **Fabric Query** - Foundry agent queries Fabric Lakehouse with appropriate access controls

### RBAC Requirements

**Backend API Managed Identity needs:**
- `Cognitive Services User` role on Azure AI Foundry resource

**Azure AI Foundry Managed Identity needs:**
- `Contributor` role on Microsoft Fabric Lakehouse workspace

### No Keys Stored

✅ **No API keys in code**  
✅ **No secrets in environment variables** (production)  
✅ **No connection strings hardcoded**  
✅ **User permissions enforced end-to-end**  

## 📂 Project Structure

### 1. Clone the Repository

```bash
git clone https://github.com/comeredon/STUHackathon.git
cd STUHackathon
```

### 2. Set Up Azure Resources

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed steps.

Required Azure resources:
- Resource Group
- Azure OpenAI Service (GPT-4 deployment)
- Azure Cosmos DB
- Azure Container Registry
- Azure Container Apps Environment
- Azure Function App
- Microsoft Fabric Workspace with Lakehouse

### 3. Configure Environment Variables

```bash
# Frontend (.env)
cp frontend/.env.example frontend/.env
# Edit with your values: Azure AD client ID, API endpoints

# Backend (.env.local)
cp api/.env.example api/.env.local
# Edit with your values: Azure OpenAI, Cosmos DB, Fabric endpoints
```

### 4. Run Locally

**Backend (Azure Functions):**
```bash
cd api
npm install
func start
```

**Frontend (React):**
```bash
cd frontend
npm install
npm run dev
```

Access at `http://localhost:5173`

### 5. Deploy to Azure

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment guide.

## 🔐 Authentication & Security

- **Azure AD Integration**: All users authenticate via Azure AD
- **Managed Identity**: Credential-free access between Azure services
- **Query Validation**: Blocks dangerous SQL operations (DROP, DELETE, UPDATE)
- **Row Limits**: Maximum 1000 rows per query
- **Audit Logging**: All queries logged to Application Insights
- **Rate Limiting**: Request throttling on API endpoints

## 🎛️ Dual Backend Modes

### Path A: Azure Functions (Custom AI Pipeline)

**Use when:**
- Need full control over AI prompts and query generation
- Want conversation history and context awareness
- Require custom validation rules
- Need detailed debugging and logging

**Flow:**
1. User message → Azure Functions
2. Retrieve conversation history from Cosmos DB
3. Generate SQL using Azure OpenAI + schema context
4. Validate and execute query on Fabric
5. Store conversation and return results

### Path B: Fabric Embedded Agent API (Native)

**Use when:**
- Want simpler integration with less code
- Prefer Fabric's native AI optimizations
- Don't need custom conversation memory
- Want potentially lower latency

**Flow:**
1. User message → Fabric Agent API
2. Fabric's built-in AI generates and executes SQL
3. Return results directly

## 📁 Project Structure

```
STUHackathon/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # Chat UI components
│   │   ├── services/      # API clients for both backends
│   │   └── auth/          # MSAL configuration
│   ├── Dockerfile         # Container configuration
│   └── package.json
├── api/                   # Azure Functions backend
│   ├── chat/              # HTTP trigger function
│   ├── utils/             # Query validation, Fabric client
│   └── package.json
├── infrastructure/        # IaC (Bicep/Terraform)
├── .github/workflows/     # CI/CD pipelines
└── docs/                  # Documentation
    ├── ARCHITECTURE.md    # Detailed architecture plan
    └── DEPLOYMENT.md      # Deployment guide
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd api
npm test

# Docker build test
cd frontend
docker build -t stuhackathon-frontend .
docker run -p 8080:80 stuhackathon-frontend
```

## 📊 Monitoring

- **Application Insights**: Request tracing, performance metrics
- **Log Analytics**: Query logs and audit trail
- **Container App Metrics**: CPU, memory, request rate
- **Function App Metrics**: Execution time, success rate

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Resources

- [Microsoft Fabric Documentation](https://learn.microsoft.com/fabric/)
- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- [Azure Functions](https://learn.microsoft.com/azure/azure-functions/)
- [Full Architecture Plan](docs/ARCHITECTURE.md)

## 📧 Support

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ for STUHackathon using Azure services**
