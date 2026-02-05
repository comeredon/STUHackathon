import { ChatMessage as ChatMessageType } from '../types/chat';
import { ChatMessage } from './ChatMessage';

interface ChatMessageListProps {
  messages: ChatMessageType[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafbff',
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            animation: 'fadeIn 0.6s ease-out',
          }}
        >
          <div style={{ maxWidth: '600px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              }}
            >
              🤖
            </div>
            <h2
              style={{
                margin: '0 0 12px 0',
                fontSize: '32px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Welcome to STUquestion bot
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
              Your intelligent AI assistant for data exploration.
              <br />
              Ask questions in natural language and get instant insights.
            </p>
            <div
              style={{
                display: 'grid',
                gap: '12px',
                marginTop: '24px',
              }}
            >
              {[
                { icon: '📊', text: 'Show me sales from last month' },
                { icon: '📈', text: 'What are the top performing products?' },
                { icon: '💰', text: 'Analyze revenue trends by region' },
              ].map((example, i) => (
                <div
                  key={i}
                  style={{
                    padding: '16px 20px',
                    background: 'white',
                    borderRadius: '12px',
                    border: '2px solid #e5e7f3',
                    fontSize: '14px',
                    color: '#475569',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7f3';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{example.icon}</span>
                  <span style={{ fontWeight: '500' }}>{example.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))
      )}
    </div>
  );
}
