import { useMemo } from 'react';

type Command = {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
};

type Props = {
  open: boolean;
  commands: Command[];
  query: string;
  onQueryChange: (v: string) => void;
  onClose: () => void;
};

const CommandPalette = ({ open, commands, query, onQueryChange, onClose }: Props) => {
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Type a command..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <div className="palette-list">
          {filtered.map((cmd) => (
            <button key={cmd.id} onClick={cmd.action} className="palette-item">
              <span>{cmd.label}</span>
              {cmd.shortcut && <code>{cmd.shortcut}</code>}
            </button>
          ))}
          {filtered.length === 0 && <div className="palette-empty">No commands</div>}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

