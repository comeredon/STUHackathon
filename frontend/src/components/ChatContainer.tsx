import { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { chatService } from '../services/chatService';
import { useBackendApiClient } from '../services/backendApiClient';
import { ChatMessage } from '../types/chat';

interface ChatContainerProps {
  demoMode?: boolean;
}

export function ChatContainer({ demoMode = false }: ChatContainerProps) {
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

  const userName = demoMode ? 'Demo User' : 'User';

  return (
    <ChatUI
      userName={userName}
      threadId={threadId}
      error={error}
      messages={messages}
      isLoading={isLoading}
      onSendMessage={handleSendMessage}
      onLogout={() => {}}
      showLogout={false}
      demoMode={demoMode}
    />
  );
}

// Wrapper component that uses MSAL
export function AuthenticatedChatContainer() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const backendApiClient = useBackendApiClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    <ChatUI
      userName={userName}
      threadId={threadId}
      error={error}
      messages={messages}
      isLoading={isLoading}
      onSendMessage={handleSendMessage}
      onLogout={handleLogout}
      showLogout={true}
      demoMode={false}
    />
  );
}

// Shared UI component
interface ChatUIProps {
  userName: string;
  threadId?: string;
  error: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onLogout: () => void;
  showLogout: boolean;
  demoMode: boolean;
}

function ChatUI({
  userName,
  threadId,
  error,
  messages,
  isLoading,
  onSendMessage,
  onLogout,
  showLogout,
  demoMode,
}: ChatUIProps) {
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
                {demoMode && <span style={{ marginLeft: '8px', backgroundColor: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '4px' }}>DEMO MODE</span>}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '2px' }}>Welcome back</div>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>{userName}</div>
            </div>
            {showLogout && (
              <button
                onClick={onLogout}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Sign Out
              </button>
            )}
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
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
