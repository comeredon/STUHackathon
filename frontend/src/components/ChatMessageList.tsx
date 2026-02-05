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
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#605e5c',
            textAlign: 'center',
          }}
        >
          <div>
            <h2 style={{ marginBottom: '8px' }}>Welcome to Fabric Chatbot</h2>
            <p>Ask questions about your data in natural language</p>
            <p style={{ fontSize: '0.9em', marginTop: '16px' }}>
              Example: "Show me sales from last month"
            </p>
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
