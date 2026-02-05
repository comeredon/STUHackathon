# Plan: Azure AI Chatbot for Fabric Lakehouse Queries

This project creates an intelligent chatbot that converts natural language questions into SQL queries for Microsoft Fabric Lakehouse, with Azure AD authentication. The architecture uses Azure Container Apps (React frontend) connected to **Azure AI Foundry with Microsoft Fabric data agent**, leveraging Foundry's native AI capabilities for query generation and execution—all following Microsoft best practices.

**CRITICAL: Research-First Development Approach**

Before implementing ANY Azure feature or service integration, developers MUST:
1. Search Microsoft Learn using `microsoft_docs_search` or `microsoft_code_sample_search` tools
2. Review official patterns and current code examples from Microsoft documentation
3. Verify authentication patterns, SDK versions, and service-specific limitations
4. Never implement based on generic knowledge—always verify with current Microsoft Learn documentation first

Workflow: **Research → Understand → Implement → Test**

**Key architectural decisions:**
- **Azure AI Foundry with Fabric data agent** → leverages Foundry's native AI agent capabilities for natural language to SQL conversion
- **Managed Identity** → secure, credential-free Fabric access
- **Azure Container Apps** → containerized frontend with flexible scaling and full control
- **Stateless design** → conversation context managed by Azure AI Foundry agent threads

**Steps**

1. **Create GitHub repository "STUHackathon"**
   - Initialize with README, .gitignore (Node, Python, Azure), and MIT license
   - Set up branch protection on main
   - Configure repo structure: `/frontend`, `/docs`, `/infrastructure`

2. **Set up Azure resources via Azure Portal or IaC**
   - Create Resource Group `rg-stuhackathon-dev`
   - Provision **Azure AI Foundry project** with Fabric data agent tool enabled
   - Document Azure AI Foundry project endpoint URL
   - Create **Azure Container Registry** for storing frontend container images
   - Create **Azure Container Apps Environment** for hosting the frontend
   - Note: Container App created during deployment step

3. **Configure Azure AI Foundry and Microsoft Fabric access**
   - Create Azure AI Foundry project in Azure Portal
   - Enable **Microsoft Fabric data agent** tool in the project
   - Create App Registration in Azure AD for frontend authentication
   - Grant workspace **Contributor** role to Azure AI Foundry's Managed Identity on your Fabric Lakehouse
   - Document Lakehouse workspace ID and connection details
   - Create or use existing AI agent (assistant) with Fabric data agent tool enabled
   - Document Agent ID and API authentication requirements
   - Test agent with sample queries in Azure AI Foundry Studio

4. **Build React frontend in `/frontend`**
   - Initialize React app with TypeScript using Vite
   - Install `@azure/msal-react`, `@azure/msal-browser` for Azure AD auth
   - Create chat UI components: message list, input box, loading indicators
   - Implement MSAL auth provider wrapping the app
   - Create Azure AI Foundry API client for agent communication
   - Implement thread creation and message posting to Foundry agent API
   - Add Azure AD token acquisition for Foundry API authentication
   - Add environment configuration for Container App and Foundry project endpoint
   - Create Dockerfile for containerized deployment with nginx

5. **Implement Azure AI Foundry integration**
   - **IMPORTANT**: Before coding, search Microsoft Learn for "azure ai foundry agents api", "fabric data agent", and "azure ai foundry authentication" to get current patterns
   - Implement agent thread creation via Azure AI Foundry REST API
   - Create message posting functionality with user queries
   - Implement run creation to execute agent with Fabric tool
   - Add polling mechanism to check run status until completion
   - Parse agent response and extract query results
   - Handle agent errors and provide user-friendly feedback
   - Implement session/thread management (create new or reuse existing threads)
   - Add Azure AD Bearer token authentication for Foundry API calls

6. **Implement security and validation layer**
   - Configure CORS for Container App domain and development localhost
   - Enable Application Insights for logging and monitoring
   - Add structured logging for all queries (audit trail)
   - Implement request throttling and rate limiting
   - Secure Azure AI Foundry API keys/credentials in Azure Key Vault
   - Add error handling for Foundry API failures and timeouts
   - Implement token refresh logic for long-running sessions

7. **Configure Azure AI Foundry agent**
   - **IMPORTANT**: Search Microsoft Learn for "azure ai foundry agents" and "fabric data agent configuration" before implementation
   - Create or configure AI agent (assistant) in Azure AI Foundry Studio
   - Enable Microsoft Fabric data agent tool on the assistant
   - Configure agent instructions for data query interpretation
   - Set up agent model (GPT-4, GPT-4 Turbo, etc.)
   - Test agent with sample natural language queries
   - Document agent ID and configuration for deployment
   - Set up agent response formatting preferences

8. **Set up Azure Container Apps deployment**
   - Build Docker image for React frontend with nginx
   - Push image to Azure Container Registry
   - Create Container App from image with ingress enabled
   - Configure Container App environment variables: Foundry project endpoint, Foundry agent ID, Azure AD client ID
   - Enable Managed Identity on Container App
   - Configure Azure AD authentication on Container App for internal users
   - Set up custom domain and SSL certificate (optional)

9. **Configure CI/CD pipeline**
   - Create GitHub Actions workflow for frontend deployment
   - **Frontend workflow**: 
     - Build React app with Foundry endpoint configuration
     - Build Docker image with environment variables
     - Push to Azure Container Registry
     - Deploy to Container App
   - Configure environment-specific variables (dev/prod)
   - Add Container App revisions for blue-green deployments
   - Set up automated testing stage (optional)

10. **Create configuration and documentation**
    - Add `.env.example` files for local development setup
    - Create Dockerfile and .dockerignore for frontend
    - Document Azure AI Foundry project setup and agent configuration
    - Create README with architecture diagram and setup instructions
    - Document Azure AD app registration steps
    - Add Container Apps deployment guide
    - Document Azure AI Foundry API usage patterns
    - Add troubleshooting guide for common issues (auth, agent errors, container issues)

**Verification**

- **Local testing**: Test React app with `npm run dev`, test Docker build locally
- **Authentication**: Verify Azure AD login redirects and token acquisition
- **Foundry connectivity**: Confirm agent API calls work with Bearer token authentication
- **Agent testing**: Test natural language queries return valid results via Foundry agent
- **Fabric data access**: Verify agent can query Lakehouse and return formatted data
- **Conversation threads**: Verify follow-up questions reference previous context in thread
- **Container deployment**: Verify Docker image builds and runs in Container Apps
- **CI/CD**: Confirm GitHub push triggers container build and deployment
- **End-to-end**: User logs in → asks "Show me sales from last month" → receives formatted results from Foundry agent

**Decisions**

- **Azure AI Foundry with Fabric agent** → leverages Foundry's native AI capabilities, integrated Fabric access, managed conversation threads
- **Stateless frontend** → conversation state managed by Foundry agent threads, simpler architecture
- **Managed Identity** over API keys → eliminates credential management, more secure (for Foundry's Fabric access)
- **Container Apps** over Static Web Apps → provides containerization flexibility, full control over runtime
- **Single backend (Foundry)** → simpler than dual backend, leverages Microsoft's managed AI platform
- **Research-first development** → ensures implementation uses current Microsoft best practices and official code samples
