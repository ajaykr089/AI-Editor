import { useMemo } from 'react';
import { FileNode } from 'shared';

type Props = {
  open: boolean;
  tree: FileNode[];
  query: string;
  onQueryChange: (v: string) => void;
  onOpen: (path: string) => void;
  onClose: () => void;
};

const flatten = (nodes: FileNode[]): FileNode[] => {
  const acc: FileNode[] = [];
  for (const n of nodes) {
    acc.push(n);
    if (n.children) acc.push(...flatten(n.children));
  }
  return acc;
};

const QuickOpen = ({ open, tree, query, onQueryChange, onOpen, onClose }: Props) => {
  const list = useMemo(() => {
    const flat = flatten(tree).filter((n) => n.type === 'file');
    const q = query.toLowerCase();
    return flat
      .filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
      .slice(0, 100);
  }, [tree, query]);

  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Quick open (Ctrl/Cmd+P)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <div className="palette-list">
          {list.map((f) => (
            <button key={f.path} onClick={() => onOpen(f.path)} className="palette-item">
              <span>{f.name}</span>
              <code>{f.path}</code>
            </button>
          ))}
          {list.length === 0 && <div className="palette-empty">No matches</div>}
        </div>
      </div>
    </div>
  );
};

export default QuickOpen;

