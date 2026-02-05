import { ChatRequest, ChatResponse } from '../types/chat';
import type { BackendApiClient } from './backendApiClient';

/**
 * Unified chat service using backend API with Managed Identity
 * All requests go through the backend API which handles OBO flow to Foundry
 */
export class ChatService {
  private apiClient: BackendApiClient | null = null;

  setApiClient(client: BackendApiClient): void {
    this.apiClient = client;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    if (!this.apiClient) {
      return {
        success: false,
        message: 'API client not initialized',
        error: 'Please ensure you are authenticated',
      };
    }

    return this.apiClient.sendMessage(request);
  }
}

export const chatService = new ChatService();
