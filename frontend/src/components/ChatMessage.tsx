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
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: isUser ? '#0078d4' : '#f3f2f1',
          color: isUser ? 'white' : '#323130',
        }}
      >
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </div>
        {message.query && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : '#edebe9',
              fontSize: '0.85em',
              fontFamily: 'monospace',
            }}
          >
            <strong>SQL Query:</strong>
            <pre style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
              {message.query}
            </pre>
          </div>
        )}
        <div
          style={{
            marginTop: '4px',
            fontSize: '0.75em',
            opacity: 0.7,
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
