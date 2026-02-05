export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  threadId?: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  threadId?: string;
  error?: string;
}
