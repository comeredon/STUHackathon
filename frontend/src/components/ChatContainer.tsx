import { useState, useEffect } from 'react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { chatService } from '../services/chatService';
import { BackendApiClient } from '../services/backendApiClient';
import { ChatMessage } from '../types/chat';

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize chat service with backend API client (no auth needed)
    const apiClient = new BackendApiClient();
    chatService.setApiClient(apiClient);
  }, []);

  const handleSendMessage = async (messageText: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatService.sendMessage({
        message: messageText,
        threadId,
      });

      if (response.success) {
        // Update threadId for conversation continuity
        if (response.threadId) {
          setThreadId(response.threadId);
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(response.error || 'An error occurred');
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Error: ${response.message}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                backdropFilter: 'blur(10px)',
              }}
            >
              🤖
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                STU BizPulse
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9, fontWeight: '400' }}>
                AI-Powered Data Intelligence
              </p>
            </div>
          </div>

        </div>

        {/* Info Banner */}
        <div
          style={{
            padding: '14px 32px',
            backgroundColor: '#f8f9fe',
            borderBottom: '1px solid #e5e7f3',
            fontSize: '13px',
            color: '#5a67d8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>✨</span>
          <span>
            Powered by <strong>Azure AI Foundry</strong> with Microsoft Fabric data agent
            {threadId && (
              <span style={{ marginLeft: '8px', opacity: 0.7 }}>• Session: {threadId.substring(0, 8)}...</span>
            )}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              color: '#991b1b',
              borderBottom: '1px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span><strong>Error:</strong> {error}</span>
          </div>
        )}

        {/* Chat Messages */}
        <ChatMessageList messages={messages} />

        {/* Chat Input */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
