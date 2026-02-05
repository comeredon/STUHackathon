import { BackendMode, ChatRequest, ChatResponse } from '../types/chat';
import { functionsApiClient } from './functionsApiClient';
import { fabricAgentApiClient } from './fabricAgentApiClient';

/**
 * Unified chat service that routes requests to the appropriate backend
 */
export class ChatService {
  private currentMode: BackendMode;

  constructor(initialMode: BackendMode = 'functions') {
    this.currentMode = initialMode;
  }

  setMode(mode: BackendMode): void {
    this.currentMode = mode;
  }

  getMode(): BackendMode {
    return this.currentMode;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const mode = request.backendMode || this.currentMode;

    switch (mode) {
      case 'functions':
        return functionsApiClient.sendMessage(request);
      case 'fabric-agent':
        return fabricAgentApiClient.sendMessage(request);
      default:
        return {
          success: false,
          message: 'Invalid backend mode',
          error: `Unknown backend mode: ${mode}`,
        };
    }
  }
}

export const chatService = new ChatService();
