# Frontend Directory

React + TypeScript frontend application for the STUHackathon chatbot.

## Setup

```bash
npm install
npm run dev
```

## Build Docker Image

```bash
docker build -t stuhackathon-frontend .
docker run -p 8080:80 stuhackathon-frontend
```

## Structure

- `/src/components` - React components
- `/src/services` - API clients for dual backend
- `/src/auth` - MSAL authentication
- `Dockerfile` - Container configuration
