# AI Agent Instructions for STUHackathon

## Project Overview

STUHackathon is an Azure AI chatbot that converts natural language to SQL queries for Microsoft Fabric Lakehouse. The architecture implements a **dual backend pattern** allowing frontend to route between:
- **Path A**: Custom Azure Functions pipeline (full control, conversation memory)
- **Path B**: Fabric Embedded Agent API (native, simpler integration)

**Current Status**: Project is in architecture/planning phase with documentation complete but implementation not yet started.

## Architecture Principles

### Dual Backend Pattern (Critical)
The frontend MUST support routing to either backend:
- Azure Functions path: `/api/chat` endpoint → handles conversation memory via Cosmos DB, custom SQL generation via Azure OpenAI GPT-4.1
- Fabric Agent path: Direct API calls → leverages Fabric's native AI, simpler but less customizable
- Frontend should include mode selector (UI toggle or environment variable) to switch between backends
- Both paths must handle authentication, query results formatting, and error handling consistently

### Technology Stack
- **Frontend**: React + TypeScript + Vite, containerized with Dockerfile → nginx, deployed to Azure Container Apps
- **Custom Backend**: Azure Functions v4 (Node.js), HTTP triggered, uses `@azure/openai`, `@azure/cosmos`, `@azure/identity`
- **AI Service**: Azure OpenAI GPT-4.1 (for Functions path only)
- **Data Storage**: Azure Cosmos DB NoSQL for conversation sessions with TTL
- **Data Warehouse**: Microsoft Fabric Lakehouse SQL endpoint
- **Authentication**: Azure AD + MSAL (`@azure/msal-react`, `@azure/msal-browser`)
- **Deployment**: Azure Container Apps (frontend), Azure Function App (backend), Azure Container Registry

### Key Architectural Decisions

**Why Lakehouse SQL over KQL**: SQL is simpler for GPT-4.1 generation and more universally familiar
**Why stateful conversations**: Better UX but requires Cosmos DB session storage and conversation summarization for token efficiency
**Why Managed Identity**: Eliminates credential management, more secure than API keys for Fabric access
**Why Container Apps**: Provides containerization flexibility, supports dual backend architecture, full runtime control
**Why GPT-4.1 over GPT-3.5**: Better SQL generation accuracy for the Functions path

## Development Workflow

### Research-First Approach (CRITICAL)

**Before implementing ANY Azure feature or service integration**, agents MUST:

1. **Search Microsoft Learn** using `microsoft_docs_search` or `microsoft_code_sample_search` tools
2. **Review official patterns** for the specific Azure service (Functions, OpenAI, Cosmos DB, Container Apps, Fabric)
3. **Use current code examples** from Microsoft documentation, not assumptions
4. **Verify authentication patterns** (Managed Identity, SDK versions, connection strings)
5. **Check for breaking changes** in Azure SDK versions or service APIs

**Examples of required research**:
- Azure Functions: Search "azure functions node.js http trigger best practices"
- Azure OpenAI: Search "azure openai javascript sdk chat completions" + get code samples
- Cosmos DB: Search "azure cosmos db nosql javascript sdk" + authentication patterns
- Fabric: Search "microsoft fabric lakehouse sql endpoint access" + connection examples
- Container Apps: Search "azure container apps deployment dockerfile"
- MSAL: Search "msal react authentication azure ad" + configuration patterns

**Workflow**: Research → Understand → Implement → Test

Never implement based on generic knowledge—always verify with current Microsoft Learn documentation first.

### Local Development Setup
```bash
# Backend (requires local.settings.json with Azure OpenAI, Cosmos DB, Fabric config)
cd api
npm install
func start  # Runs on localhost:7071

# Frontend (requires .env with Azure AD client ID, API URLs)
cd frontend
npm install
npm run dev  # Runs on localhost:5173

# Test Docker build locally
cd frontend
docker build -t stuhackathon-frontend .
docker run -p 8080:80 stuhackathon-frontend
```

**Important**: Never commit `.env`, `.env.local`, or `local.settings.json` files (already in .gitignore)

### Project Structure Convention
```
STUHackathon/
├── api/                      # Azure Functions backend
│   ├── chat/                 # HTTP trigger function
│   ├── utils/                # Query validation, Fabric client, OpenAI helpers
│   ├── host.json             # Function runtime config
│   └── package.json
├── frontend/                 # React app
│   ├── src/
│   │   ├── components/       # Chat UI components
│   │   ├── services/         # Dual backend API clients (Functions + Fabric Agent)
│   │   └── auth/             # MSAL configuration
│   ├── Dockerfile            # nginx-based container
│   └── package.json
├── infrastructure/           # IaC (Bicep or Terraform)
├── .github/workflows/        # CI/CD pipelines (to be created)
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
- **Azure Functions**: "azure functions javascript v4 programming model", "azure functions http trigger"
- **Azure OpenAI**: "azure openai javascript chat completion", "azure openai system message"
- **Cosmos DB**: "cosmos db javascript sdk nosql api", "cosmos db partition key best practices"
- **Fabric Lakehouse**: "microsoft fabric sql endpoint connection", "fabric lakehouse query"
- **Container Apps**: "azure container apps environment variables", "container apps managed identity"
- **MSAL React**: "msal react configuration", "azure ad authentication spa"

### Security Requirements (Non-Negotiable)

**Query Validation** (api/utils/): 
- Block DROP, DELETE, UPDATE, ALTER, CREATE statements
- Only allow SELECT queries
- Enforce 1000 row limit
- Set 30-second query timeout

**Authentication**:
- Azure AD for all user access (MSAL integration in frontend)
- Managed Identity for Function App → Fabric Lakehouse access
- Managed Identity for Container App (if needed)
- CORS configuration must restrict to Container App domain + localhost for development

**Audit Logging**:
- All queries must be logged to Application Insights with timestamp, user ID, query text, results count
- Use structured logging for easy querying

### Conversation Memory Pattern (Functions Path Only)

Cosmos DB schema for `chat-sessions` container:
```json
{
  "id": "session-uuid",
  "sessionId": "session-uuid",
  "messages": [
    { "role": "user", "content": "Show me sales from last month", "timestamp": "ISO-8601" },
    { "role": "assistant", "content": "Results...", "query": "SELECT...", "timestamp": "ISO-8601" }
  ],
  "ttl": 3600  // Auto-expire after 1 hour
}
```

- Retrieve full conversation history at request start
- Append new user message
- Generate SQL using conversation context
- Store assistant response with generated query
- Return formatted results

### Azure OpenAI Prompt Engineering (Functions Path)

**Before implementation**: Search Microsoft Learn for "azure openai chat completions" and "azure openai javascript sdk" to get current API patterns, token limits, and best practices.

System prompt structure:
```
You are a SQL expert for Microsoft Fabric Lakehouse.
Schema: {inject Fabric table/column definitions}
Examples: {few-shot natural language → SQL pairs}
Rules: Only generate SELECT statements, no modifications allowed.
```

- Use conversation summarization when token count > 3000 to stay within limits
- Include explicit fallback responses for ambiguous queries
- Version prompts in code comments for iteration tracking
- **Get code samples** from Microsoft Learn for proper message formatting and token management

### Fabric Integration Patterns

**IMPORTANT**: Always search Microsoft Learn for "microsoft fabric lakehouse" and "fabric sql endpoint" before implementing to get current connection patterns and authentication methods.

**SQL Endpoint Access** (Functions path):
```javascript
// Use @azure/identity DefaultAzureCredential for Managed Identity
// Connection: {fabric-sql-endpoint}
// Execute with parameterized queries
// Search Microsoft Learn: "fabric lakehouse sql endpoint nodejs" for current SDK examples
```

**Fabric Agent API** (direct path):
- Frontend calls Fabric Agent API directly with user message
- Fabric handles AI generation and query execution internally
- Requires Fabric Agent API endpoint URL and authentication token/key
- Return results in consistent format matching Functions path
- **Search Microsoft Learn**: "fabric embedded agent api" for latest endpoint configuration and auth patterns

### Frontend-Backend Contract

Both backend paths must accept and return the same payload structure:

Request:
```typescript
{ message: string, sessionId: string, backendMode?: 'functions' | 'fabric-agent' }
```

Response:
```typescript
{
  success: boolean,
  data?: { columns: string[], rows: any[][], query?: string },
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

**CI/CD expectations** (.github/workflows/ to be created):
1. Frontend workflow: Build React → Build Docker image → Push to ACR → Deploy to Container App
2. Backend workflow: Build/test Functions → Deploy to Function App
3. Use GitHub secrets for Azure credentials
4. Support environment-specific deployments (dev/prod)

## Testing Requirements

**Before Implementation**:
- Verify Azure resources exist (OpenAI, Cosmos DB, Fabric workspace, Container Registry)
- Test Managed Identity permissions on Fabric workspace
- Test Fabric Agent API authentication and endpoint accessibility

**During Development**:
- Test query validation blocks dangerous operations
- Test both backend paths return consistent response formats
- Verify conversation memory retrieval and storage (Functions path)
- Test Docker build locally before pushing

**End-to-End Validation**:
1. User authenticates via Azure AD
2. Frontend mode selector toggles between Functions/Fabric Agent
3. User asks: "Show me sales from last month"
4. Backend generates valid SQL (Functions) or Fabric Agent handles query
5. Results display in chat UI with proper formatting
6. Follow-up question uses conversation context (Functions path)

## Common Patterns

**Error Handling**: Always return user-friendly messages, log technical details to Application Insights
**CORS Configuration**: Whitelist Container App URL + `http://localhost:5173` for local dev
**Environment Variables**: Use `.env.example` files as templates, document all required variables
**Fabric Schema Updates**: Export schema as JSON, version it, inject into OpenAI prompts
**Rate Limiting**: Implement in Function App to prevent abuse

## Resources

- Architecture details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- API README: [api/README.md](api/README.md)
- Frontend README: [frontend/README.md](frontend/README.md)
- Infrastructure README: [infrastructure/README.md](infrastructure/README.md)

## Questions to Resolve

When implementing, clarify:
1. Fabric Embedded Agent API endpoint format and authentication mechanism
2. Specific Fabric Lakehouse schema (table names, columns for prompt engineering)
3. Azure AD app registration details (client ID, tenant ID, redirect URIs)
4. Container Registry name and resource group for CI/CD
5. Whether to use Bicep or Terraform for IaC implementation
