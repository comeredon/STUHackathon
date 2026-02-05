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
        padding: '16px',
        borderTop: '1px solid #edebe9',
        display: 'flex',
        gap: '8px',
      }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a question about your data..."
        disabled={isLoading}
        style={{
          flex: 1,
          padding: '12px',
          border: '1px solid #8a8886',
          borderRadius: '4px',
          fontSize: '14px',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        style={{
          padding: '12px 24px',
          backgroundColor: isLoading || !input.trim() ? '#c8c6c4' : '#0078d4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
