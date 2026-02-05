# AI Agent Instructions for STUHackathon

## Project Overview

STUHackathon is an Azure AI chatbot that converts natural language to SQL queries for Microsoft Fabric Lakehouse. The architecture uses **Azure AI Foundry** with the Microsoft Fabric data agent tool, providing a managed AI platform that handles query generation, execution, and conversation management.

**Current Status**: Frontend deployed to Azure Container Apps with Azure AD authentication. Azure AI Foundry integration in progress.

## Architecture Principles

### Azure AI Foundry Integration (Critical)
The application connects to Azure AI Foundry for all natural language processing:
- **Azure AI Foundry project** handles AI agent management and execution
- **Fabric data agent tool** provides native access to Fabric Lakehouse data
- **Agent threads** manage conversation context and history
- Frontend authenticates users via Azure AD and calls Foundry REST API with Bearer tokens
- Stateless frontend design - all conversation state managed by Foundry

### Technology Stack
- **Frontend**: React + TypeScript + Vite, containerized with Dockerfile → nginx, deployed to Azure Container Apps
- **AI Platform**: Azure AI Foundry with Fabric data agent tool
- **Data Warehouse**: Microsoft Fabric Lakehouse
- **Authentication**: Azure AD + MSAL (`@azure/msal-react`, `@azure/msal-browser`)
- **Deployment**: Azure Container Apps (frontend), Azure Container Registry

### Key Architectural Decisions

**Why Azure AI Foundry**: Managed AI platform with native Fabric integration, handles agent execution and conversation threads
**Why Fabric data agent**: Built-in tool for querying Fabric Lakehouse, no custom SQL generation needed
**Why Managed Identity**: Eliminates credential management, more secure for Foundry's Fabric access
**Why Container Apps**: Provides containerization flexibility, full runtime control
**Why stateless frontend**: Conversation managed by Foundry agent threads, simpler architecture

## Development Workflow

### Research-First Approach (CRITICAL)

**Before implementing ANY Azure feature or service integration**, agents MUST:

1. **Search Microsoft Learn** using `microsoft_docs_search` or `microsoft_code_sample_search` tools
2. **Review official patterns** for the specific Azure service (Azure AI Foundry, Container Apps, Fabric)
3. **Use current code examples** from Microsoft documentation, not assumptions
4. **Verify authentication patterns** (Managed Identity, SDK versions, connection strings)
5. **Check for breaking changes** in Azure SDK versions or service APIs

**Examples of required research**:
- Azure AI Foundry: Search "azure ai foundry agents api" + "fabric data agent"
- Authentication: Search "azure ai foundry authentication bearer token"
- Container Apps: Search "azure container apps deployment dockerfile"
- MSAL: Search "msal react authentication azure ad" + configuration patterns
- Fabric: Search "microsoft fabric lakehouse" + "fabric data agent configuration"

**Workflow**: Research → Understand → Implement → Test

Never implement based on generic knowledge—always verify with current Microsoft Learn documentation first.

### Local Development Setup
```bash
# Frontend (requires .env with Azure AD client ID, Foundry endpoint)
cd frontend
npm install
npm run dev  # Runs on localhost:5173

# Test Docker build locally
cd frontend
docker build -t stuhackathon-frontend .
docker run -p 8080:80 stuhackathon-frontend
```

**Important**: Never commit `.env`, `.env.local` files (already in .gitignore)

### Project Structure Convention
```
STUHackathon/
├── frontend/                 # React app
│   ├── src/
│   │   ├── components/       # Chat UI components
│   │   ├── services/         # Azure AI Foundry API client
│   │   └── auth/             # MSAL configuration
│   ├── Dockerfile            # nginx-based container
│   └── package.json
├── infrastructure/           # IaC (Bicep or Terraform)
├── .github/workflows/        # CI/CD pipelines
└── docs/                     # Architecture and deployment guides
```

## Implementation Guidelines

### Pre-Implementation Checklist

Before writing any code for Azure services:

- [ ] Search Microsoft Learn for service-specific best practices and current patterns
- [ ] Get official code samples using `microsoft_code_sample_search` with appropriate language filter
- [ ] Verify SDK package versions and authentication methods from official docs
- [ ] Review security and networking requirements from Microsoft documentation
- [ ] Check for service-specific limitations and quotas

**Example searches by component**:
- **Azure AI Foundry**: "azure ai foundry agents api rest", "azure ai foundry authentication"
- **Fabric data agent**: "fabric data agent configuration", "microsoft fabric agent tool"
- **Container Apps**: "azure container apps environment variables", "container apps managed identity"
- **MSAL React**: "msal react configuration", "azure ad authentication spa"

### Security Requirements (Non-Negotiable)

**Authentication**:
- Azure AD for all user access (MSAL integration in frontend)
- Bearer token authentication for Azure AI Foundry API calls
- Managed Identity for Foundry project's Fabric access
- CORS configuration must restrict to Container App domain + localhost for development

**Audit Logging**:
- All queries must be logged to Application Insights with timestamp, user ID, query text, results count
- Use structured logging for easy querying

### Azure AI Foundry Integration Pattern

**IMPORTANT**: Always search Microsoft Learn for "azure ai foundry agents" and "fabric data agent" before implementing to get current API patterns, authentication methods, and response formats.

**Foundry API Flow**:
```typescript
// 1. Create or retrieve thread
POST {FOUNDRY_ENDPOINT}/threads
Headers: Authorization: Bearer {token}

// 2. Post user message
POST {FOUNDRY_ENDPOINT}/threads/{threadId}/messages
Body: { role: "user", content: "<user query>" }

// 3. Create run with agent
POST {FOUNDRY_ENDPOINT}/threads/{threadId}/runs
Body: { assistant_id: "{agentId}" }

// 4. Poll run status
GET {FOUNDRY_ENDPOINT}/threads/{threadId}/runs/{runId}
// Wait until status === "completed"

// 5. Retrieve agent response
GET {FOUNDRY_ENDPOINT}/threads/{threadId}/messages
// Parse latest assistant message
```

- Use `@azure/msal-react` to acquire Bearer tokens for Foundry API
- Implement exponential backoff for run status polling
- Handle agent errors (failed runs, timeouts) gracefully
- **Search Microsoft Learn**: "azure ai foundry agents api" for latest endpoint structure and authentication

### Frontend-Foundry Contract

Request flow:
```typescript
{ message: string, threadId?: string }
```

Response structure:
```typescript
{
  success: boolean,
  data?: { content: string, runId?: string, threadId?: string },
  message: string,
  error?: string
}
```

### Docker and Deployment

**Frontend Dockerfile pattern**:
- Multi-stage build: `node:18` for build, `nginx:alpine` for serve
- Copy build output to `/usr/share/nginx/html/`
- Expose port 80
- Environment variables injected at Container App runtime

**CI/CD expectations** (.github/workflows/):
1. Frontend workflow: Build React → Build Docker image → Push to ACR → Deploy to Container App
2. Use GitHub secrets for Azure credentials
3. Support environment-specific deployments (dev/prod)

## Testing Requirements

**Before Implementation**:
- Verify Azure AI Foundry project exists
- Test Fabric data agent tool is enabled and configured
- Test agent with sample queries in Azure AI Foundry Studio
- Verify Managed Identity permissions on Fabric workspace

**During Development**:
- Test Foundry API authentication with Bearer tokens
- Verify thread creation and message posting
- Test run creation and status polling
- Verify agent responses are properly parsed
- Test Docker build locally before pushing

**End-to-End Validation**:
1. User authenticates via Azure AD
2. User asks: "Show me sales from last month"
3. Frontend creates thread and posts message to Foundry API
4. Foundry agent with Fabric tool executes query
5. Results display in chat UI with proper formatting
6. Follow-up question uses existing thread for context

## Common Patterns

**Error Handling**: Always return user-friendly messages, log technical details to Application Insights
**CORS Configuration**: Whitelist Container App URL + `http://localhost:5173` for local dev
**Environment Variables**: Use `.env.example` files as templates, document all required variables
**Rate Limiting**: Implement in frontend to prevent abuse

## Resources

- Architecture details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Frontend README: [frontend/README.md](frontend/README.md)
- Infrastructure README: [infrastructure/README.md](infrastructure/README.md)

## Questions to Resolve

When implementing, clarify:
1. Azure AI Foundry project endpoint URL and authentication mechanism
2. Specific agent ID for the Fabric data agent
3. Fabric Lakehouse workspace ID and connection details
4. Azure AD app registration details (client ID, tenant ID, redirect URIs)
5. Container Registry name and resource group for CI/CD
6. Whether to use Bicep or Terraform for IaC implementation
