# Backend API - STUHackathon

Node.js + TypeScript + Express backend API for STUHackathon chatbot with Azure AI Foundry integration using **Managed Identity** and **On-Behalf-Of (OBO)** authentication flow.

## 🔐 Security Architecture

This backend implements a secure, keyless architecture:

1. **User Authentication**: Frontend authenticates users with Azure AD
2. **Token Forwarding**: Frontend sends user Bearer token to backend
3. **On-Behalf-Of (OBO) Flow**: Backend exchanges user token for Azure AI Foundry access token
4. **Managed Identity**: In production, Container App's Managed Identity is used for OBO exchange
5. **No API Keys**: Zero secrets stored in code or configuration

## Setup

```bash
npm install
npm run dev
``
