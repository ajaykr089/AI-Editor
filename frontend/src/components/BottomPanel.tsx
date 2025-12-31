import { useState } from 'react';

type PanelType = 'problems' | 'output' | 'debug' | 'terminal';

type TerminalTab = {
  id: string;
  name: string;
  output: string[];
  currentCommand: string;
};

type Props = {
  problems: { message: string }[];
  output: string[];
  debugMessages: string[];
  onTerminalCommand: (cmd: string) => void;
  terminalTabs?: TerminalTab[];
  activeTerminalTab?: string;
  onTerminalTabSwitch?: (tabId: string) => void;
  onNewTerminalTab?: () => void;
  onCloseTerminalTab?: (tabId: string) => void;
};

const BottomPanel = ({
  problems,
  output,
  debugMessages,
  onTerminalCommand,
  terminalTabs = [],
  activeTerminalTab = '',
  onTerminalTabSwitch,
  onNewTerminalTab,
  onCloseTerminalTab
}: Props) => {
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
              {/* Terminal Tabs */}
              <div className="terminal-tabs-bar" style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                padding: '0 8px',
                gap: '4px'
              }}>
                {terminalTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`terminal-tab ${activeTerminalTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTerminalTabSwitch?.(tab.id)}
                    style={{
                      padding: '4px 8px',
                      cursor: 'pointer',
                      borderRadius: '4px 4px 0 0',
                      background: activeTerminalTab === tab.id ? 'var(--panel)' : 'transparent',
                      border: activeTerminalTab === tab.id ? '1px solid var(--border)' : 'none',
                      borderBottom: activeTerminalTab === tab.id ? 'none' : '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <span>{tab.name}</span>
                    {terminalTabs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseTerminalTab?.(tab.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '0 2px',
                          marginLeft: '4px'
                        }}
                        title="Close Terminal"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={onNewTerminalTab}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '4px 8px',
                    marginLeft: '4px'
                  }}
                  title="New Terminal"
                >
                  +
                </button>
              </div>

              {/* Terminal Output */}
              <div className="terminal-output">
                {terminalTabs.find(tab => tab.id === activeTerminalTab)?.output.map((line, idx) => (
                  <div key={idx} className="terminal-line">
                    {line}
                  </div>
                ))}
                {!terminalTabs.find(tab => tab.id === activeTerminalTab)?.output.length && (
                  <div className="terminal-line">AI Editor Terminal</div>
                )}
              </div>

              {/* Terminal Input */}
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
