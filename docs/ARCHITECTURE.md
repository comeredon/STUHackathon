# Plan: Azure AI Chatbot for Fabric Lakehouse Queries

This project creates an intelligent chatbot that converts natural language questions into SQL queries for Microsoft Fabric Lakehouse, with Azure AD authentication and conversation memory. The architecture uses Azure Container Apps (React), dual backend connectivity (Azure Functions + Fabric Embedded Agent API), Azure OpenAI GPT-4.1 for query generation, and Azure Cosmos DB for conversation history—all following Microsoft best practices.

**CRITICAL: Research-First Development Approach**

Before implementing ANY Azure feature or service integration, developers MUST:
1. Search Microsoft Learn using `microsoft_docs_search` or `microsoft_code_sample_search` tools
2. Review official patterns and current code examples from Microsoft documentation
3. Verify authentication patterns, SDK versions, and service-specific limitations
4. Never implement based on generic knowledge—always verify with current Microsoft Learn documentation first

Workflow: **Research → Understand → Implement → Test**

**Key architectural decisions:**
- **Lakehouse SQL endpoint** chosen (vs KQL) → simpler SQL query generation
- **Stateful conversations** → requires Azure Cosmos DB for session storage  
- **Managed Identity** → secure, credential-free Fabric access
- **Azure Container Apps** → containerized frontend with flexible scaling and full control
- **Dual backend connectivity** → frontend can route to either custom Azure Functions OR Fabric Embedded Agent API

**Steps**

1. **Create GitHub repository "STUHackathon"**
   - Initialize with README, .gitignore (Node, Python, Azure), and MIT license
   - Set up branch protection on main
   - Configure repo structure: `/frontend`, `/api`, `/infrastructure`

2. **Set up Azure resources via Azure Portal or IaC**
   - Create Resource Group `rg-stuhackathon-dev`
   - Provision **Azure OpenAI Service** with GPT-4.1 deployment
   - Create **Azure Cosmos DB** (NoSQL API) for conversation history with container `chat-sessions`
   - Create **Azure Container Registry** for storing frontend container images
   - Create **Azure Container Apps Environment** for hosting the frontend
   - Note: Container App and Function App created during deployment step

3. **Configure Microsoft Fabric access**
   - Create App Registration in Azure AD for development
   - Grant workspace **Contributor** role to the service principal on your Fabric Lakehouse
   - Document Lakehouse SQL endpoint connection string
   - **Enable and configure Fabric Embedded Agent API** in your workspace
   - Document Fabric Agent API endpoint URL and authentication requirements
   - Export sample schema (tables/columns) for prompt engineering

4. **Build React frontend in `/frontend`**
   - Initialize React app with TypeScript using Vite
   - Install `@azure/msal-react`, `@azure/msal-browser` for Azure AD auth
   - Create chat UI components: message list, input box, loading indicators
   - Implement MSAL auth provider wrapping the app
   - Build **dual backend routing layer** with mode selector (Functions vs Fabric Agent)
   - Create API client for `/api/chat` endpoint (Azure Functions path)
   - Create Fabric Agent API client for direct Fabric Embedded Agent calls
   - Add configuration toggle for backend selection (UI switch or environment variable)
   - Add environment configuration for Container App, Functions URL, and Fabric Agent endpoint
   - Create Dockerfile for containerized deployment with nginx

5. **Create Azure Functions backend in `/api`**
   - **IMPORTANT**: Before coding, search Microsoft Learn for "azure functions javascript v4", "azure openai javascript sdk", "cosmos db javascript sdk", and "fabric lakehouse sql endpoint" to get current patterns
   - Initialize Node.js Azure Functions project (v4 HTTP triggered function)
   - Install dependencies: `@azure/openai`, `@azure/cosmos`, `@azure/identity`, `@azure/msal-node`
   - Create `/api/chat` POST endpoint accepting `{ message, sessionId }`
   - Implement **conversation retrieval** from Cosmos DB by sessionId
   - Build **Azure OpenAI GPT-4.1 integration** with system prompt including Fabric schema
   - Add **SQL query generation** logic with validation patterns
   - Implement **Fabric query execution** using SQL endpoint with Managed Identity
   - Store conversation turns in Cosmos DB with timestamp and query results
   - Return formatted response with query results and conversational answer

6. **Implement security and validation layer**
   - Add query validation: block DROP/DELETE/UPDATE statements, only allow SELECT
   - Implement query row limit enforcement (max 1000 rows)
   - Add query timeout configuration (30 seconds)
   - Configure CORS for Container App domain and development localhost
   - Enable Application Insights for logging and monitoring
   - Add structured logging for all queries (audit trail)
   - Implement request throttling and rate limiting in Functions
   - Add API key validation if Fabric Agent API requires it

7. **Create prompt engineering templates**
   - **IMPORTANT**: Search Microsoft Learn for "azure openai chat completions" and "azure openai system message" before implementation
   - Design system prompt with Fabric schema injection for GPT-4.1
   - Include example natural language → SQL pairs (few-shot learning)
   - Add conversation context summarization for token efficiency
   - Create fallback responses for ambiguous queries
   - Document prompt versioning for iteration

8. **Set up Azure Container Apps and Functions deployment**
   - Deploy Azure Functions to dedicated Function App resource
   - Configure Function App settings: OpenAI endpoint/key, Cosmos DB connection, Fabric endpoint
   - Enable Managed Identity on Function App
   - Grant Function App Managed Identity access to Fabric workspace
   - Build Docker image for React frontend with nginx
   - Push image to Azure Container Registry
   - Create Container App from image with ingress enabled
   - Configure Container App environment variables: Functions URL, Fabric Agent URL, Azure AD client ID
   - Enable Managed Identity on Container App
   - Configure Azure AD authentication on Container App for internal users
   - Set up custom domain and SSL certificate (optional)

9. **Configure CI/CD pipeline**
   - Create GitHub Actions workflow for multi-stage deployment
   - **Frontend workflow**: 
     - Build React app
     - Build Docker image
     - Push to Azure Container Registry
     - Deploy to Container App
   - **Backend workflow**:
     - Build and test Azure Functions
     - Deploy to Function App
   - Configure environment-specific variables (dev/prod)
   - Add Container App revisions for blue-green deployments
   - Set up automated testing stage (optional)

10. **Create configuration and documentation**
    - Add `.env.example` files for local development setup
    - Create Dockerfile and .dockerignore for frontend
    - Document Fabric schema format and update procedure
    - Document Fabric Embedded Agent API usage and endpoint configuration
    - Create README with architecture diagram and setup instructions
    - Document Azure AD app registration steps
    - Add Container Apps deployment guide
    - Document backend selection logic and when to use each path
    - Add troubleshooting guide for common issues (auth, query errors, container issues)

**Verification**

- **Local testing**: Run Functions locally with `func start`, test React app with `npm run dev`, test Docker build locally
- **Authentication**: Verify Azure AD login redirects and token acquisition
- **Dual backend testing**: Test both Azure Functions path AND Fabric Agent API path
- **Query generation**: Test natural language queries return valid SQL (Functions path)
- **Fabric Agent testing**: Verify direct Fabric Agent API calls work with authentication
- **Fabric connectivity**: Confirm queries execute against Lakehouse and return data
- **Conversation memory**: Verify follow-up questions reference previous context
- **Backend switching**: Confirm UI can toggle between Functions and Fabric Agent modes
- **Container deployment**: Verify Docker image builds and runs in Container Apps
- **CI/CD**: Confirm GitHub push triggers container build and deployment
- **End-to-end**: User logs in → selects backend mode → asks "Show me sales from last month" → receives formatted results

**Decisions**

- **Chose Lakehouse SQL** over KQL → simpler for GPT-4.1, more familiar query language
- **Cosmos DB** for sessions → fast key-value lookups, auto-expiry TTL, serverless pricing
- **Stateful conversations** → better UX but adds complexity, uses conversation summarization to manage token costs
- **Managed Identity** over API keys → eliminates credential management, more secure
- **Container Apps** over Static Web Apps → provides containerization flexibility, better for dual backend architecture, full control over runtime
- **Dual backend approach** → allows comparison between custom AI pipeline vs Fabric's native agent, provides fallback options, enables A/B testing
- **GPT-4.1** over GPT-3.5 → better SQL generation accuracy, worth the cost for query reliability (Functions path)
- **Fabric Embedded Agent API** → leverages Fabric's native AI capabilities, potentially simpler but less customizable than Functions path
- **Research-first development** → ensures implementation uses current Microsoft best practices and official code samples
