import { FileNode } from 'shared';
import { MdOutlineNoteAdd, MdOutlineCreateNewFolder, MdOutlineRefresh, MdOutlineCropSquare } from 'react-icons/md';
import { FaFolder, FaFile } from 'react-icons/fa';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { memo } from 'react';

type Props = {
  nodes: FileNode[];
  onSelect: (path: string) => void;
  selectedPath: string | null;
  onRefresh: () => void;
  onContextMenu: (node: FileNode, pos: { x: number; y: number }) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onCollapseAll: () => void;
  onRevealInFinder: (path: string) => void;
  onCopyPath: (path: string) => void;
  onCopyRelativePath: (path: string) => void;
  onOpenFolder: (path: string) => void;
};

type TreeNodeProps = {
  node: FileNode;
  level: number;
  onSelect: (path: string) => void;
  selectedPath: string | null;
  onContextMenu: (node: FileNode, pos: { x: number; y: number }) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
};

const TreeNode = memo(({
  node,
  level,
  onSelect,
  selectedPath,
  onContextMenu,
  expandedFolders,
  onToggleFolder,
}: TreeNodeProps) => {
  const isSelected = selectedPath === node.path;
  const isExpanded = expandedFolders.has(node.path);
  const hasChildren = node.children && node.children.length > 0;

  // Memoize event handlers to prevent unnecessary re-renders
  const handleSelect = useCallback(() => {
    onSelect(node.path);
  }, [node.path, onSelect]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(node, { x: e.clientX, y: e.clientY });
  }, [node, onContextMenu]);

  const handleToggleFolder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFolder(node.path);
  }, [node.path, onToggleFolder]);

  return (
    <div className="tree-node" style={{ paddingLeft: `${level * 12}px` }}>
      <div
        className={`tree-row ${isSelected ? 'selected' : ''}`}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
      >
        {hasChildren && (
          <span 
            className="tree-expand-icon"
            onClick={handleToggleFolder}
            style={{ 
              marginRight: '6px',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: '10px'
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="tree-icon">
          {node.type === 'folder' ? <FaFolder size={14} /> : <FaFile size={14} />}
        </span>
        <span>{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        node.children.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            level={level + 1}
            onSelect={onSelect}
            selectedPath={selectedPath}
            onContextMenu={onContextMenu}
            expandedFolders={expandedFolders}
            onToggleFolder={onToggleFolder}
          />
        ))
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

const FileTree = memo(({ nodes, onSelect, selectedPath, onRefresh, onContextMenu, onCreateFile, onCreateFolder, onCollapseAll }: Props) => {
  // State for managing expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Memoize the expandFolders function to prevent unnecessary recalculations
  const expandFolders = useCallback((fileNodes: FileNode[]) => {
    const newExpanded = new Set<string>();
    const expand = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          newExpanded.add(node.path);
          expand(node.children);
        }
      });
    };
    expand(fileNodes);
    return newExpanded;
  }, []);

  // Initialize expanded state when nodes change
  useEffect(() => {
    const newExpanded = expandFolders(nodes);
    setExpandedFolders(newExpanded);
  }, [nodes, expandFolders]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleToggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandedFolders(new Set());
    if (onCollapseAll) onCollapseAll();
  }, [onCollapseAll]);

  // Memoize the file operation handlers
  const handleCreateFile = useCallback(() => {
    onCreateFile();
  }, [onCreateFile]);

  const handleCreateFolder = useCallback(() => {
    onCreateFolder();
  }, [onCreateFolder]);

  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <strong>EXPLORER</strong>
        <div className="file-op-buttons">
          <button 
            className="ghost" 
            onClick={handleCreateFile}
            title="New File (Ctrl+N)"
          >
            <MdOutlineNoteAdd size={16} />
          </button>
          <button 
            className="ghost" 
            onClick={handleCreateFolder}
            title="New Folder"
          >
            <MdOutlineCreateNewFolder size={16} />
          </button>
          <button 
            className="ghost" 
            onClick={handleRefresh}
            title="Refresh Explorer (Ctrl+R)"
          >
            <MdOutlineRefresh size={16} />
          </button>
          <button 
            className="ghost" 
            onClick={handleCollapseAll}
            title="Collapse Folders"
          >
            <MdOutlineCropSquare size={16} />
          </button>
        </div>
      </div>
      <div className="tree">
        {nodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            level={0}
            onSelect={onSelect}
            selectedPath={selectedPath}
            onContextMenu={onContextMenu}
            expandedFolders={expandedFolders}
            onToggleFolder={handleToggleFolder}
          />
        ))}
      </div>
    </aside>
  );
});

FileTree.displayName = 'FileTree';

export default FileTree;
