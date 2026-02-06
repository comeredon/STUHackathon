import { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '../types/chat';
import { ChatMessage } from './ChatMessage';

interface ChatMessageListProps {
  messages: ChatMessageType[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
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
        <>
          {messages.map((message, index) => {
            // isLatest is true for the last assistant message
            const isLastMessage = index === messages.length - 1;
            const isLatestAssistant = isLastMessage && message.role === 'assistant';
            return (
              <ChatMessage 
                key={index} 
                message={message} 
                isLatest={isLatestAssistant}
              />
            );
          })}
          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </>
      )}
    </div>
  );
}
