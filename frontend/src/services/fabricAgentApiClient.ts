import { ChatRequest, ChatResponse } from '../types/chat';

const FOUNDRY_API_URL = import.meta.env.VITE_FOUNDRY_API_URL || '';
const FOUNDRY_API_KEY = import.meta.env.VITE_FOUNDRY_API_KEY || '';

/**
 * Azure AI Foundry API client with Fabric data agent
 * Uses Foundry's responses API for natural language to SQL conversion
 */
export class FabricAgentApiClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string = FOUNDRY_API_URL, apiKey: string = FOUNDRY_API_KEY) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    if (!this.apiUrl) {
      return {
        success: false,
        message: 'Azure AI Foundry API URL is not configured',
        error: 'VITE_FOUNDRY_API_URL environment variable is missing',
      };
    }

    if (!this.apiKey) {
      return {
        success: false,
        message: 'Azure AI Foundry API key is not configured',
        error: 'VITE_FOUNDRY_API_KEY environment variable is missing',
      };
    }

    try {
      // Azure AI Foundry responses API expects a messages array
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: request.message,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Transform Foundry response to unified format
      // Foundry responses API returns choices array with message content
      const content = data.choices?.[0]?.message?.content || data.message || 'No response';
      
      return {
        success: true,
        message: content,
      };
    } catch (error) {
      console.error('Azure AI Foundry API error:', error);
      return {
        success: false,
        message: 'Failed to communicate with Azure AI Foundry',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const fabricAgentApiClient = new FabricAgentApiClient();
