import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '20px',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
            background: isUser
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          {isUser ? '👤' : '🤖'}
        </div>
        <div
          style={{
            padding: '14px 18px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'white',
            color: isUser ? 'white' : '#2d3748',
            boxShadow: isUser
              ? '0 4px 15px rgba(102, 126, 234, 0.3)'
              : '0 2px 10px rgba(0, 0, 0, 0.08)',
            border: isUser ? 'none' : '1px solid #e5e7f3',
          }}
        >
          <div
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: '1.6',
              fontSize: '15px',
            }}
          >
            {message.content}
          </div>
          {message.query && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : '#f8f9fe',
                fontSize: '13px',
                fontFamily: 'JetBrains Mono, monospace',
                border: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7f3',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '6px', opacity: isUser ? 1 : 0.7 }}>
                📊 SQL Query:
              </div>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  fontSize: '12px',
                  opacity: isUser ? 0.95 : 0.8,
                }}
              >
                {message.query}
              </pre>
            </div>
          )}
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              opacity: 0.6,
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
