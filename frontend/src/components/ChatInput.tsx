import { useState, FormEvent, useRef, useCallback } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

// Check if Speech Recognition is supported
const SpeechRecognition = (typeof window !== 'undefined') 
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition 
  : null;

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const isSupported = !!SpeechRecognition;
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  const stopListening = useCallback(() => {
    console.log('Stopping speech recognition...');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Stop error:', e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    // Stop any existing session first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    console.log('Creating new speech recognition instance...');
    
    // Create a fresh recognition instance each time
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Single utterance mode - more reliable
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    transcriptRef.current = '';

    recognition.onstart = () => {
      console.log('✅ Speech recognition STARTED - speak now!');
      setIsListening(true);
    };

    recognition.onaudiostart = () => {
      console.log('🎤 Audio capture started');
    };

    recognition.onsoundstart = () => {
      console.log('🔊 Sound detected');
    };

    recognition.onspeechstart = () => {
      console.log('🗣️ Speech detected');
    };

    recognition.onresult = (event: any) => {
      console.log('📝 Got result event:', event.results);
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      const fullTranscript = (transcriptRef.current + finalTranscript + interimTranscript).trim();
      console.log('Transcript:', fullTranscript);
      setInput(fullTranscript);
      
      if (finalTranscript) {
        transcriptRef.current += finalTranscript + ' ';
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error, event);
      
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please click the lock icon in your browser address bar and allow microphone access, then refresh the page.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected - this is normal if you didn\'t speak');
      } else if (event.error === 'audio-capture') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else if (event.error === 'network') {
        alert('Network error during speech recognition. Please check your internet connection.');
      }
      
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onspeechend = () => {
      console.log('🗣️ Speech ended');
    };

    recognitionRef.current = recognition;

    // Request microphone permission explicitly first
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        console.log('🎤 Microphone access granted');
        // Stop the stream - we just needed permission
        stream.getTracks().forEach(track => track.stop());
        
        // Now start recognition
        try {
          recognition.start();
          console.log('Recognition.start() called');
        } catch (e) {
          console.error('Failed to start recognition:', e);
          setIsListening(false);
          alert('Failed to start voice input. Please try again.');
        }
      })
      .catch((err) => {
        console.error('Microphone permission denied:', err);
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
        setIsListening(false);
      });
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      setInput(''); // Clear input before starting
      startListening();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      stopListening(); // Stop if still listening
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
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#fafbff',
      }}
    >
      {!isSupported && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#92400e',
            textAlign: 'center',
          }}
        >
          ⚠️ Voice input not supported in this browser. Try Chrome, Edge, or Safari.
        </div>
      )}
      <div style={{ display: 'flex', gap: '12px' }}>
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
              title={isListening ? 'Stop recording' : 'Start voice input (Click to speak)'}
              aria-label={isListening ? 'Stop recording' : 'Start voice input'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                border: isListening ? '2px solid #f5576c' : '2px solid transparent',
                background: isListening
                  ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                transition: 'all 0.3s ease',
                boxShadow: isListening
                  ? '0 0 20px rgba(245, 87, 108, 0.6)'
                  : '0 3px 10px rgba(102, 126, 234, 0.4)',
                animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                  e.currentTarget.style.boxShadow = isListening
                    ? '0 0 25px rgba(245, 87, 108, 0.8)'
                    : '0 5px 15px rgba(102, 126, 234, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                e.currentTarget.style.boxShadow = isListening
                  ? '0 0 20px rgba(245, 87, 108, 0.6)'
                  : '0 3px 10px rgba(102, 126, 234, 0.4)';
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
      </div>
    </form>
  );
}
