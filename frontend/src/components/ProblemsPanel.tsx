type Props = {
  problems: { message: string }[];
};

const ProblemsPanel = ({ problems }: Props) => {
  if (!problems.length) return null;
  
  const parseProblem = (message: string) => {
    // Try to parse line number from message (e.g., "Line 5: Error message")
    const lineMatch = message.match(/^Line\s*(\d+):\s*(.+)$/i);
    if (lineMatch) {
      return {
        line: parseInt(lineMatch[1], 10),
        message: lineMatch[2],
        severity: message.includes('error') ? 'error' : message.includes('warn') ? 'warning' : 'info'
      };
    }
    return {
      line: null,
      message,
      severity: message.includes('error') ? 'error' : message.includes('warn') ? 'warning' : 'info'
    };
  };

  return (
    <div className="problems-panel">
      <div className="panel-title">Problems</div>
      <div className="problems-list">
        {problems.map((p, idx) => {
          const parsed = parseProblem(p.message);
          return (
            <div key={idx} className="problem-item">
              <span className={`problem-icon ${parsed.severity}`}>
                {parsed.severity === 'error' ? '●' : parsed.severity === 'warning' ? '▲' : '○'}
              </span>
              <div className="problem-content">
                <div className="problem-message">{parsed.message}</div>
                {parsed.line && (
                  <div className="problem-meta">Line {parsed.line}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProblemsPanel;
