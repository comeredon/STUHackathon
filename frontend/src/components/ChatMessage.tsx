import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Custom styles for markdown content
const markdownStyles = `
  .markdown-content {
    line-height: 1.7;
    font-size: 15px;
  }
  .markdown-content p {
    margin: 0 0 12px 0;
  }
  .markdown-content p:last-child {
    margin-bottom: 0;
  }
  .markdown-content h1, .markdown-content h2, .markdown-content h3 {
    margin: 16px 0 8px 0;
    font-weight: 600;
  }
  .markdown-content h1 { font-size: 1.4em; }
  .markdown-content h2 { font-size: 1.2em; }
  .markdown-content h3 { font-size: 1.1em; }
  .markdown-content ul, .markdown-content ol {
    margin: 8px 0;
    padding-left: 24px;
  }
  .markdown-content li {
    margin: 4px 0;
  }
  .markdown-content code {
    background: rgba(0, 0, 0, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.9em;
  }
  .markdown-content pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 16px;
    border-radius: 10px;
    overflow-x: auto;
    margin: 12px 0;
    font-size: 13px;
    line-height: 1.5;
  }
  .markdown-content pre code {
    background: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }
  .markdown-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 14px;
    background: #fafbfc;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .markdown-content th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .markdown-content td {
    padding: 10px 16px;
    border-bottom: 1px solid #e8ecf0;
  }
  .markdown-content tr:last-child td {
    border-bottom: none;
  }
  .markdown-content tr:nth-child(even) {
    background: #f4f6f8;
  }
  .markdown-content tr:hover {
    background: #eef1f5;
  }
  .markdown-content blockquote {
    border-left: 4px solid #667eea;
    margin: 12px 0;
    padding: 8px 16px;
    background: #f8f9fe;
    border-radius: 0 8px 8px 0;
    color: #555;
  }
  .markdown-content a {
    color: #667eea;
    text-decoration: none;
  }
  .markdown-content a:hover {
    text-decoration: underline;
  }
  .markdown-content strong {
    font-weight: 600;
    color: #2d3748;
  }
  .markdown-content hr {
    border: none;
    border-top: 1px solid #e5e7f3;
    margin: 16px 0;
  }
`;

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <>
      <style>{markdownStyles}</style>
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
              padding: '16px 20px',
              borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: isUser
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'white',
              color: isUser ? 'white' : '#2d3748',
              boxShadow: isUser
                ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                : '0 2px 10px rgba(0, 0, 0, 0.08)',
              border: isUser ? 'none' : '1px solid #e5e7f3',
              minWidth: isUser ? 'auto' : '300px',
            }}
          >
            {isUser ? (
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
            ) : (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
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
                marginTop: '10px',
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
    </>
  );
}
