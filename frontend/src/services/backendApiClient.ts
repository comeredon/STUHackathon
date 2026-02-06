import { useMsal } from '@azure/msal-react';
import { ChatRequest, ChatResponse } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Check if we're in demo mode
const isDemoMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('demo') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
};

/**
 * Backend API client with user authentication via Bearer token
 * Uses On-Behalf-Of (OBO) flow for Azure AI Foundry access
 */
export class BackendApiClient {
  private apiUrl: string;
  private getToken: () => Promise<string>;
  private demoMode: boolean;

  constructor(apiUrl: string, getToken: () => Promise<string>, demoMode: boolean = false) {
    this.apiUrl = apiUrl;
    this.getToken = getToken;
    this.demoMode = demoMode;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    if (!this.apiUrl) {
      return {
        success: false,
        message: 'Backend API URL is not configured',
        error: 'VITE_API_URL environment variable is missing',
      };
    }

    try {
      // Use demo endpoint in demo mode, otherwise use authenticated endpoint
      const endpoint = this.demoMode ? `${this.apiUrl}/chat/demo` : `${this.apiUrl}/chat`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add auth header if not in demo mode
      if (!this.demoMode) {
        const token = await this.getToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: request.message,
          threadId: request.threadId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: data.data.content,
          threadId: data.data.threadId,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Request failed',
          error: data.error,
        };
      }
    } catch (error) {
      console.error('Backend API error:', error);
      return {
        success: false,
        message: 'Failed to communicate with backend API',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Hook to create BackendApiClient with MSAL token (or demo mode)
 */
export const useBackendApiClient = (): BackendApiClient => {
  const demoMode = isDemoMode();
  
  if (demoMode) {
    // In demo mode, return a client that doesn't need auth
    return new BackendApiClient(API_URL, async () => '', true);
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { instance, accounts } = useMsal();

  const getToken = async (): Promise<string> => {
    if (accounts.length === 0) {
      throw new Error('No authenticated user');
    }

    const request = {
      scopes: ['https://cognitiveservices.azure.com/.default'],
      account: accounts[0],
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition failed:', error);
      throw new Error('Failed to acquire authentication token');
    }
  };

  return new BackendApiClient(API_URL, getToken, false);
};
