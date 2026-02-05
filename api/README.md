# API Directory

Azure Functions backend for the STUHackathon chatbot.

## Setup

```bash
npm install
func start
```

## Functions

- `chat/` - HTTP trigger for chat endpoint
  - Accepts POST requests with `{ message, sessionId }`
  - Integrates with Azure OpenAI
  - Queries Microsoft Fabric Lakehouse
  - Manages conversation history in Cosmos DB

## Structure

- `/chat` - Main chat function
- `/utils` - Shared utilities (query validation, Fabric client)
- `host.json` - Function host configuration
- `local.settings.json` (not in repo) - Local environment variables
