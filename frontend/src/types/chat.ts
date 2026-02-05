export type BackendMode = 'functions' | 'fabric-agent';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  query?: string; // Optional SQL query for visualization
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
