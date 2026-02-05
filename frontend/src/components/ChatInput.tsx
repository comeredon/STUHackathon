import { useState, FormEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput(''); // Clear input when starting new recording
      recognitionRef.current.start();
      setIsListening(true);
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
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? 'Listening... Speak now' : 'Ask me anything about your data...'}
          disabled={isLoading || isListening}
          style={{
            width: '100%',
            padding: '16px 60px 16px 20px',
            border: `2px solid ${isListening ? '#667eea' : '#e5e7f3'}`,
            borderRadius: '16px',
            fontSize: '15px',
            outline: 'none',
            transition: 'all 0.3s ease',
            backgroundColor: isListening ? '#f8f9fe' : 'white',
            fontFamily: 'inherit',
            boxShadow: isListening ? '0 0 0 4px rgba(102, 126, 234, 0.1)' : 'none',
          }}
          onFocus={(e) => {
            if (!isListening) {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
            }
          }}
          onBlur={(e) => {
            if (!isListening) {
              e.currentTarget.style.borderColor = '#e5e7f3';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        />
        {isSupported && (
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={isLoading}
            title={isListening ? 'Stop recording' : 'Start voice input'}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              background: isListening
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.3s ease',
              boxShadow: isListening
                ? '0 0 20px rgba(245, 87, 108, 0.5)'
                : '0 2px 8px rgba(102, 126, 234, 0.3)',
              animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            {isListening ? '⏹' : '🎤'}
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={!input.trim() || isLoading || isListening}
        style={{
          padding: '16px 32px',
          background: isLoading || !input.trim() || isListening
            ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: isLoading || !input.trim() || isListening ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: isLoading || !input.trim() || isListening
            ? 'none'
            : '0 4px 15px rgba(102, 126, 234, 0.4)',
          minWidth: '120px',
        }}
        onMouseEnter={(e) => {
          if (!isLoading && input.trim() && !isListening) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isLoading || !input.trim() || isListening
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
