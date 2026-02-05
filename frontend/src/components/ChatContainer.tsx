import { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { chatService } from '../services/chatService';
import { useBackendApiClient } from '../services/backendApiClient';
import { ChatMessage } from '../types/chat';

export function ChatContainer() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const backendApiClient = useBackendApiClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize chat service with backend API client
    chatService.setApiClient(backendApiClient);
  }, [backendApiClient]);

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

  const handleLogout = () => {
    instance.logoutPopup();
  };

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f3f2f1',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1>Please sign in to continue</h1>
          <p>Authenticating with Azure AD...</p>
        </div>
      </div>
    );
  }

  const userName = accounts[0]?.name || accounts[0]?.username || 'User';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#0078d4',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '20px' }}>
          Fabric Lakehouse Chatbot
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>Welcome, {userName}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#0078d4',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#f3f2f1',
          borderBottom: '1px solid #edebe9',
          fontSize: '14px',
          color: '#605e5c',
        }}
      >
        ℹ️ Connected to <strong>Azure AI Foundry</strong> with Microsoft Fabric data agent via secure backend API
        {threadId && <span style={{ marginLeft: '8px' }}>• Thread: {threadId.substring(0, 8)}...</span>}
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fde7e9',
            color: '#a80000',
            borderBottom: '1px solid #edebe9',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Chat Messages */}
      <ChatMessageList messages={messages} />

      {/* Chat Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
