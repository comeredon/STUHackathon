import { useMsal } from '@azure/msal-react';
import { ChatRequest, ChatResponse } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Backend API client with user authentication via Bearer token
 * Uses On-Behalf-Of (OBO) flow for Azure AI Foundry access
 */
export class BackendApiClient {
  private apiUrl: string;
  private getToken: () => Promise<string>;

  constructor(apiUrl: string, getToken: () => Promise<string>) {
    this.apiUrl = apiUrl;
    this.getToken = getToken;
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
      // Get user's access token
      const token = await this.getToken();

      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
 * Hook to create BackendApiClient with MSAL token
 */
export const useBackendApiClient = (): BackendApiClient => {
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

  return new BackendApiClient(API_URL, getToken);
};
