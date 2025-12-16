import { useState } from 'react';

type PanelType = 'problems' | 'output' | 'debug' | 'terminal';

type Props = {
  problems: { message: string }[];
  output: string[];
  debugMessages: string[];
  onTerminalCommand?: (cmd: string) => void;
};

const BottomPanel = ({ problems, output, debugMessages, onTerminalCommand }: Props) => {
  const [activePanel, setActivePanel] = useState<PanelType>('problems');
  const [isVisible, setIsVisible] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminalInput.trim() && onTerminalCommand) {
      onTerminalCommand(terminalInput.trim());
      setTerminalInput('');
    }
  };

  const panelTabs: { id: PanelType; label: string; badge?: number }[] = [
    { id: 'problems', label: 'Problems', badge: problems.length },
    { id: 'output', label: 'Output', badge: output.length },
    { id: 'debug', label: 'Debug Console', badge: debugMessages.length },
    { id: 'terminal', label: 'Terminal' },
  ];

  return (
    <>
      <div className="bottom-panel-tabs">
        {panelTabs.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab ${activePanel === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActivePanel(tab.id);
              setIsVisible(true);
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
        <button className="panel-tab-close" onClick={() => setIsVisible(!isVisible)} title={isVisible ? 'Hide' : 'Show'}>
          {isVisible ? '▼' : '▲'}
        </button>
      </div>
      {isVisible && (
        <div className="bottom-panel-content">
          {activePanel === 'problems' && (
            <div className="panel-content">
              {problems.length > 0 ? (
                <div className="problems-list">
                  {problems.map((p, idx) => (
                    <div key={idx} className="problem-item">
                      <span className="problem-icon">⚠</span>
                      <span>{p.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-empty">No problems detected</div>
              )}
            </div>
          )}
          {activePanel === 'output' && (
            <div className="panel-content">
              {output.length > 0 ? (
                <div className="output-list">
                  {output.map((line, idx) => (
                    <div key={idx} className="output-line">
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-empty">No output</div>
              )}
            </div>
          )}
          {activePanel === 'debug' && (
            <div className="panel-content">
              {debugMessages.length > 0 ? (
                <div className="debug-list">
                  {debugMessages.map((msg, idx) => (
                    <div key={idx} className="debug-line">
                      {msg}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-empty">No debug messages</div>
              )}
            </div>
          )}
          {activePanel === 'terminal' && (
            <div className="panel-content terminal-content">
              <div className="terminal-output">
                <div className="terminal-line">AI Editor Terminal</div>
                <div className="terminal-line">Type commands below (basic commands supported)</div>
              </div>
              <form onSubmit={handleTerminalSubmit} className="terminal-input-form">
                <span className="terminal-prompt">$</span>
                <input
                  type="text"
                  className="terminal-input"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Enter command..."
                />
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default BottomPanel;

