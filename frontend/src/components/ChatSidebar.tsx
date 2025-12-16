import { useState } from 'react';
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

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <aside className="chat-sidebar">
      <div className="sidebar-header">
        <strong>Assistant</strong>
      </div>
      <div className="sidebar-section">
        <div className="panel-title">Outline</div>
        <div className="outline-list">
          {outline.map((o, idx) => (
            <button key={idx} className="outline-item" onClick={() => onJumpToLine(o.line)}>
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
              {p.message}
            </div>
          ))}
          {problems.length === 0 && <div className="muted">No problems</div>}
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-bubble ${m.role}`}>
            <div className="role">{m.role}</div>
            <div>{m.content}</div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <textarea
          placeholder="Ask anything about the code..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </aside>
  );
};

export default ChatSidebar;

