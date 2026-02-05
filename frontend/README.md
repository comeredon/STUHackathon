# Frontend - STUHackathon Chatbot

React + TypeScript frontend application for the STUHackathon chatbot with dual backend support.

## Features

- 🔐 **Azure AD Authentication** - MSAL React integration with redirect flow
- 🔄 **Dual Backend Support** - Switch between Azure Functions or Fabric Agent API
- 💬 **Chat Interface** - Modern, responsive chat UI with message history
- 🎯 **Mode Selector** - UI toggle to switch backend modes in real-time
- 🐳 **Docker Ready** - Multi-stage Dockerfile with nginx for production

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Authentication**: @azure/msal-react + @azure/msal-browser
- **Styling**: Inline styles (easily replaceable with CSS framework)
- **Deployment**: Docker + nginx

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Azure AD app registration (client ID, tenant ID)

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your values:
   ```env
   VITE_AZURE_CLIENT_ID=your-client-id
   VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
   VITE_FUNCTIONS_API_URL=http://localhost:7071/api/chat
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173)

## Available Scripts

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── auth/                     # MSAL configuration
│   │   └── authConfig.ts         # Azure AD settings
│   ├── components/               # React components
│   │   ├── BackendSelector.tsx   # Mode toggle UI
│   │   ├── ChatContainer.tsx     # Main chat component
│   │   ├── ChatInput.tsx         # Message input
│   │   ├── ChatMessage.tsx       # Message bubble
│   │   └── ChatMessageList.tsx   # Message list
│   ├── services/                 # API clients
│   │   ├── chatService.ts        # Unified service
│   │   ├── functionsApiClient.ts # Azure Functions client
│   │   └── fabricAgentApiClient.ts # Fabric Agent client
│   ├── types/                    # TypeScript types
│   │   └── chat.ts               # Chat interfaces
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles
│   └── vite-env.d.ts             # Vite types
├── public/                       # Static assets
├── Dockerfile                    # Multi-stage Docker build
├── nginx.conf                    # nginx configuration
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

## Backend Integration

### Azure Functions Path
- Full conversation memory via Cosmos DB
- Custom SQL generation with Azure OpenAI GPT-4.1
- Detailed query validation and audit logging

### Fabric Agent Path
- Direct Fabric Embedded Agent API calls
- Native Fabric AI query generation
- Simpler integration, less customizable

## Docker Build

Build the container image:
```bash
docker build -t stuhackathon-frontend .
```

Run locally:
```bash
docker run -p 8080:80 stuhackathon-frontend
```

Access at [http://localhost:8080](http://localhost:8080)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_AZURE_CLIENT_ID` | Azure AD app client ID | Yes |
| `VITE_AZURE_AUTHORITY` | Azure AD authority URL | Yes |
| `VITE_REDIRECT_URI` | OAuth redirect URI | Yes |
| `VITE_POST_LOGOUT_REDIRECT_URI` | Post-logout redirect | Yes |
| `VITE_FUNCTIONS_API_URL` | Azure Functions endpoint | Yes |
| `VITE_FABRIC_AGENT_API_URL` | Fabric Agent API endpoint | No |
| `VITE_FABRIC_AGENT_API_KEY` | Fabric Agent API key | No |

## Authentication Flow

1. User accesses app → redirected to Azure AD
2. After authentication → redirected back with token
3. Token stored in session storage (configurable)
4. All API calls include user context
5. Sign out → clears session and redirects

## Development Tips

- **Hot reload**: Vite provides instant HMR
- **MSAL debugging**: Check console for auth logs
- **Backend switching**: Use UI toggle to test both paths
- **Mock mode**: Modify services to return mock data for offline development

## Troubleshooting

**MSAL redirect loop**:
- Verify `redirectUri` matches Azure AD app registration
- Check browser console for MSAL errors

**CORS errors**:
- Ensure backend allows `http://localhost:5173`
- Check network tab for preflight requests

**Build errors**:
- Run `npm install` to ensure dependencies are installed
- Clear `node_modules` and reinstall if needed

## License

MIT

- `Dockerfile` - Container configuration
