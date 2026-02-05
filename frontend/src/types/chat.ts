export type BackendMode = 'functions' | 'fabric-agent';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  query?: string;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  backendMode?: BackendMode;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    columns: string[];
    rows: any[][];
    query?: string;
  };
  message: string;
  error?: string;
}
