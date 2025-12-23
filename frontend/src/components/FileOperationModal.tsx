import React, { useState, useEffect } from 'react';
import Modal from './Modal';

type OperationType = 'create' | 'rename';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  operation: OperationType;
  targetType: 'file' | 'folder';
  currentPath?: string;
  onConfirm: (name: string) => void;
};

const FileOperationModal = ({ 
  isOpen, 
  onClose, 
  operation, 
  targetType, 
  currentPath, 
  onConfirm 
}: Props) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (operation === 'rename' && currentPath) {
        const fileName = currentPath.split('/').pop() || '';
        setName(fileName);
      } else {
        setName('');
      }
      setError('');
    }
  }, [isOpen, operation, currentPath]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    
    // Validation
    if (value.trim() === '') {
      setError('Name cannot be empty');
    } else if (value.includes('/') || value.includes('\\')) {
      setError('Name cannot contain slashes');
    } else if (value.includes('..')) {
      setError('Name cannot contain ".."');
    } else if (value.trim() !== value) {
      setError('Name cannot start or end with spaces');
    } else {
      setError('');
    }
  };

  const handleConfirm = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name cannot be empty');
      return;
    }
    if (trimmedName.includes('/') || trimmedName.includes('\\')) {
      setError('Name cannot contain slashes');
      return;
    }
    if (trimmedName.includes('..')) {
      setError('Name cannot contain ".."');
      return;
    }
    if (trimmedName.trim() !== trimmedName) {
      setError('Name cannot start or end with spaces');
      return;
    }
    
    onConfirm(trimmedName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !error && name.trim()) {
      handleConfirm();
    }
  };

  const getTitle = () => {
    if (operation === 'create') {
      return `New ${targetType}`;
    } else {
      return `Rename ${targetType}`;
    }
  };

  const getPlaceholder = () => {
    if (operation === 'create') {
      return targetType === 'file' ? 'Enter file name (e.g., main.js)' : 'Enter folder name (e.g., components)';
    } else {
      return targetType === 'file' ? 'Enter new file name' : 'Enter new folder name';
    }
  };

  const getHelpText = () => {
    if (operation === 'create') {
      return `Creating a new ${targetType}. Choose a descriptive name without special characters.`;
    } else {
      return `Renaming "${currentPath?.split('/').pop()}" to a new name.`;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="modal-body">
        <div className="modal-help">
          {getHelpText()}
        </div>
        <input
          className="modal-input"
          type="text"
          value={name}
          onChange={handleNameChange}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          autoFocus
        />
        {error && (
          <div className="error" style={{ fontSize: '12px' }}>
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button 
            className="primary" 
            onClick={handleConfirm}
            disabled={!!error || !name.trim()}
          >
            {operation === 'create' ? 'Create' : 'Rename'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FileOperationModal;
