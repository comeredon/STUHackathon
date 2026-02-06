import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest?: boolean; // If true and assistant message, show typewriter effect
}

// Custom styles for markdown tables
const markdownStyles = `
  .markdown-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 13px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .markdown-content th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .markdown-content td {
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7f3;
    background: #fafbfc;
  }
  .markdown-content tr:nth-child(even) td {
    background: #f4f5f9;
  }
  .markdown-content tr:hover td {
    background: #eef0f8;
  }
  .markdown-content tr:last-child td {
    border-bottom: none;
  }
  .markdown-content strong {
    color: #5a67d8;
  }
  .markdown-content ul, .markdown-content ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  .markdown-content li {
    margin: 4px 0;
  }
  .markdown-content p {
    margin: 8px 0;
  }
  .markdown-content code {
    background: #f1f3f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }
`;

export function ChatMessage({ message, isLatest = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const shouldAnimate = !isUser && isLatest;
  
  const [displayedLength, setDisplayedLength] = useState(shouldAnimate ? 0 : message.content.length);
  const [isTyping, setIsTyping] = useState(shouldAnimate);
  const contentRef = useRef(message.content);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Track if this message's content has changed (for new messages)
  useEffect(() => {
    if (shouldAnimate && message.content !== contentRef.current) {
      contentRef.current = message.content;
      setDisplayedLength(0);
      setIsTyping(true);
    }
  }, [message.content, shouldAnimate]);
  
  // Typewriter effect
  useEffect(() => {
    if (!shouldAnimate || !isTyping) return;
    
    const fullLength = message.content.length;
    if (displayedLength >= fullLength) {
      setIsTyping(false);
      return;
    }
    
    // Speed: faster for longer messages, with a minimum speed
    const baseSpeed = 5; // ms per character
    const charsPerTick = Math.max(1, Math.floor(fullLength / 500)); // Type multiple chars for long messages
    
    const timer = setTimeout(() => {
      setDisplayedLength(prev => Math.min(prev + charsPerTick, fullLength));
    }, baseSpeed);
    
    return () => clearTimeout(timer);
  }, [displayedLength, isTyping, message.content.length, shouldAnimate]);
  
  // Auto-scroll while typing
  useEffect(() => {
    if (isTyping && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayedLength, isTyping]);
  
  // Reset animation when message becomes "not latest"
  useEffect(() => {
    if (!isLatest && isTyping) {
      setDisplayedLength(message.content.length);
      setIsTyping(false);
    }
  }, [isLatest, isTyping, message.content.length]);

  const displayedContent = shouldAnimate && isTyping 
    ? message.content.slice(0, displayedLength)
    : message.content;

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
          maxWidth: isUser ? '75%' : '90%',
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
            maxWidth: isUser ? 'none' : '100%',
            overflow: 'auto',
          }}
        >
          <style>{markdownStyles}</style>
          <div
            className={isUser ? '' : 'markdown-content'}
            style={{
              whiteSpace: isUser ? 'pre-wrap' : 'normal',
              wordBreak: 'break-word',
              lineHeight: '1.6',
              fontSize: '15px',
            }}
          >
            {isUser ? (
              message.content
            ) : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayedContent}
                </ReactMarkdown>
                {isTyping && (
                  <span 
                    style={{ 
                      display: 'inline-block',
                      width: '2px',
                      height: '1em',
                      backgroundColor: '#667eea',
                      marginLeft: '2px',
                      animation: 'blink 0.7s infinite',
                    }}
                  />
                )}
              </>
            )}
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
          <div ref={messageEndRef} />
        </div>
      </div>
    </div>
  );
}
