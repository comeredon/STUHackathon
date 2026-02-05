import { ChatRequest, ChatResponse } from '../types/chat';

const FABRIC_API_URL = import.meta.env.VITE_FABRIC_AGENT_API_URL || '';
const FABRIC_API_KEY = import.meta.env.VITE_FABRIC_AGENT_API_KEY || '';

/**
 * Fabric Embedded Agent API client
 * Leverages Fabric's native AI capabilities for query generation and execution
 */
export class FabricAgentApiClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string = FABRIC_API_URL, apiKey: string = FABRIC_API_KEY) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    if (!this.apiUrl) {
      return {
        success: false,
        message: 'Fabric Agent API URL is not configured',
        error: 'VITE_FABRIC_AGENT_API_URL environment variable is missing',
      };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({
          message: request.message,
          sessionId: request.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform Fabric Agent response to match our unified format
      return {
        success: true,
        data: data.data,
        message: data.message || 'Query executed successfully',
      };
    } catch (error) {
      console.error('Fabric Agent API error:', error);
      return {
        success: false,
        message: 'Failed to communicate with Fabric Agent API',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const fabricAgentApiClient = new FabricAgentApiClient();
