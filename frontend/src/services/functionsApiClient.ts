import { ChatRequest, ChatResponse } from '../types/chat';

const FUNCTIONS_API_URL = import.meta.env.VITE_FUNCTIONS_API_URL || 'http://localhost:7071/api/chat';

/**
 * Azure Functions backend client
 * Handles conversation memory and custom SQL generation via Azure OpenAI GPT-4.1
 */
export class FunctionsApiClient {
  private apiUrl: string;

  constructor(apiUrl: string = FUNCTIONS_API_URL) {
    this.apiUrl = apiUrl;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Functions API error:', error);
      return {
        success: false,
        message: 'Failed to communicate with Azure Functions backend',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const functionsApiClient = new FunctionsApiClient();
