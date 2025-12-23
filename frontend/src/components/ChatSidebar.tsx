import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from 'shared';

type Props = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  outline: { label: string; line: number }[];
  problems: { message: string }[];
  onJumpToLine: (line: number) => void;
};

const ChatSidebar = ({ messages, onSend, outline, problems, onJumpToLine }: Props) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  const handleQuickAction = (action: string) => {
    setText(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSend();
    }
  };

  return (
    <aside className="chat-sidebar">
      <div className="sidebar-header">
        <strong>AI Assistant</strong>
        <span className="muted" style={{ fontSize: '11px' }}>Press Ctrl/Cmd + Enter to send</span>
      </div>
      
      <div className="sidebar-section">
        <div className="panel-title">Quick Actions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button className="outline-item" onClick={() => handleQuickAction('Explain this code')}>
            Explain Code
          </button>
          <button className="outline-item" onClick={() => handleQuickAction('Find bugs in this code')}>
            Find Bugs
          </button>
          <button className="outline-item" onClick={() => handleQuickAction('Refactor this code')}>
            Refactor
          </button>
          <button className="outline-item" onClick={() => handleQuickAction('Add comments to this code')}>
            Add Comments
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="panel-title">Outline</div>
        <div className="outline-list">
          {outline.map((o, idx) => (
            <button key={idx} className="outline-item" onClick={() => onJumpToLine(o.line)}>
              <span style={{ color: 'var(--muted)', marginRight: '8px' }}>Ln {o.line}</span>
              {o.label}
            </button>
          ))}
          {outline.length === 0 && <div className="muted">No symbols detected</div>}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="panel-title">Problems</div>
        <div className="outline-list">
          {problems.map((p, idx) => (
            <div key={idx} className="problem-item">
              <span style={{ color: '#fbbf24', marginRight: '8px' }}>•</span>
              {p.message}
            </div>
          ))}
          {problems.length === 0 && <div className="muted">No problems detected</div>}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-bubble ${m.role}`}>
            <div className="role">
              {m.role === 'assistant' ? '🤖 Assistant' : '👤 You'}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          placeholder="Ask anything about the code... (e.g., 'How does this function work?', 'What does this variable do?', 'Suggest improvements')"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="ghost" onClick={() => setText('')}>
            Clear
          </button>
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
