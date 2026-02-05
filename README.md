# STUHackathon - Azure AI Chatbot for Fabric

An intelligent chatbot application that converts natural language questions into SQL queries for Microsoft Fabric Lakehouse, featuring dual backend connectivity and Azure AD authentication.

## 🚀 Overview

This project demonstrates a modern cloud-native architecture for building AI-powered chatbots that can query data warehouses using natural language. Users can ask questions like "Show me sales from last month" and receive formatted results from Microsoft Fabric Lakehouse.

### Key Features

- 🤖 **Dual Backend Architecture**: Choose between custom Azure Functions pipeline or native Fabric Embedded Agent API
- 🔐 **Azure AD Authentication**: Secure internal user access with Easy Auth
- 💬 **Conversation Memory**: Stateful conversations with context awareness
- 🎯 **Intent Recognition**: Azure OpenAI GPT-4 for natural language understanding and SQL generation
- 🐳 **Containerized Frontend**: React app deployed on Azure Container Apps
- 📊 **Microsoft Fabric Integration**: Direct Lakehouse SQL endpoint access
- 🔒 **Security First**: Query validation, row limits, audit logging, and Managed Identity

## 🏗️ Architecture

```
User → Azure Container Apps (React) → Dual Backend Router
                                        ├─ Path A: Azure Functions → Azure OpenAI → Fabric
                                        └─ Path B: Fabric Embedded Agent API → Fabric
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Chat UI with backend mode selector |
| **Container Hosting** | Azure Container Apps | Scalable containerized frontend |
| **Custom Backend** | Azure Functions (Node.js v4) | Custom AI pipeline with conversation memory |
| **AI Service** | Azure OpenAI (GPT-4) | Natural language to SQL conversion |
| **Native Backend** | Fabric Embedded Agent API | Fabric's built-in AI capabilities |
| **Data Warehouse** | Microsoft Fabric Lakehouse | SQL endpoint for data queries |
| **Session Storage** | Azure Cosmos DB | Conversation history (custom path) |
| **Authentication** | Azure AD + Easy Auth | Secure user access |
| **CI/CD** | GitHub Actions | Automated container and function deployment |

## 📋 Prerequisites

- Azure Subscription
- GitHub Account
- Microsoft Fabric Workspace with Lakehouse
- Node.js 18+ and npm
- Docker Desktop
- Azure CLI
- Azure Functions Core Tools v4

## 🎯 Quick Start

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
