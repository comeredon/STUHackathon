import { useState, FormEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '24px 32px 32px 32px',
        borderTop: '1px solid #e5e7f3',
        display: 'flex',
        gap: '12px',
        backgroundColor: '#fafbff',
      }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything about your data..."
        disabled={isLoading}
        style={{
          flex: 1,
          padding: '16px 20px',
          border: '2px solid #e5e7f3',
          borderRadius: '16px',
          fontSize: '15px',
          outline: 'none',
          transition: 'all 0.3s ease',
          backgroundColor: 'white',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#667eea';
          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e5e7f3';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        style={{
          padding: '16px 32px',
          background: isLoading || !input.trim()
            ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: isLoading || !input.trim()
            ? 'none'
            : '0 4px 15px rgba(102, 126, 234, 0.4)',
          minWidth: '120px',
        }}
        onMouseEnter={(e) => {
          if (!isLoading && input.trim()) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isLoading || !input.trim()
            ? 'none'
            : '0 4px 15px rgba(102, 126, 234, 0.4)';
        }}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>●</span>
            Sending
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            Send
            <span style={{ fontSize: '18px' }}>→</span>
          </span>
        )}
      </button>
    </form>
  );
}
