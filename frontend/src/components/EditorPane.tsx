import Editor, { OnMount, OnChange, OnValidate } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import TabsBar from './TabsBar';

type Props = {
  value: string;
  onChange: (value: string) => void;
  language: string;
  filePath: string;
  theme: 'light' | 'dark';
  onRequestAutocomplete: (opts: { content: string; line: number; column: number }) => Promise<{
    suggestions: string[];
  }>;
  onCursorChange: (pos: { line: number; column: number }) => void;
  tabs:{ path: string; label: string; dirty?: boolean }[];
  activePath:string | null;
  onSelect:(path: string)=>void;
  onClose:(path: string)=>void;
};

const EditorPane = ({ value, onChange, language, filePath, onRequestAutocomplete, theme, onCursorChange, tabs, activePath, onClose, onSelect }: Props) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const autocompleteDisposable = useRef<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [currentLine, setCurrentLine] = useState<number | null>(null);

  // Memoize autocomplete provider to prevent re-registration on every render
  const autocompleteProvider = useCallback(() => {
    if (!monacoRef.current) return;
    
    return monacoRef.current.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['.', ' ', '(', "'", '"', '/', '\\', '<', '>', '{', '}', '[', ']', '=', ':', '-', '_', '+', '*', '#', '@', '!', '?', '%', '^', '&'],
      provideCompletionItems: async (model: any, position: any) => {
        const text = model.getValue();
        const { lineNumber, column } = position;
        const response = await onRequestAutocomplete({ content: text, line: lineNumber, column });
        const suggestions = response.suggestions.map((label, idx) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: label,
          range: undefined,
          sortText: `0${idx}`,
        }));
        return { suggestions };
      },
    });
  }, [language, onRequestAutocomplete]);

  useEffect(() => {
    if (!monacoRef.current) return;
    // re-register provider when language changes
    autocompleteDisposable.current?.dispose?.();
    autocompleteDisposable.current = autocompleteProvider();
  }, [autocompleteProvider]);

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    // Enhanced editor options
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      scrollBeyondLastLine: false,
      wordWrap: "on",
      lineNumbers: "on",
      roundedSelection: true,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnType: true,
      formatOnPaste: true,
      folding: true,
      foldingHighlight: true,
      guides: {
        indentation: true,
        bracketPairs: true
      },
      bracketPairColorization: {
        enabled: true
      },
      parameterHints: {
        enabled: true
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      suggest: {
        showKeywords: true,
        showFunctions: true,
        showClasses: true,
        showModules: true,
        showVariables: true,
        showWords: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showIssues: true
      }
    });

    editor.onDidChangeCursorPosition((e) => {
      onCursorChange({ line: e.position.lineNumber, column: e.position.column });
      setCurrentLine(e.position.lineNumber);
    });

    // Add line highlighting
    const decorationId = editor.createDecorationsCollection([{
      range: new monaco.Range(1, 1, 1, 1),
      options: {
        className: 'current-line-highlight',
        isWholeLine: true,
        inlineClassName: 'current-line-gutter'
      }
    }]);

    // Set up marker listener for error highlighting
    monaco.editor.onDidChangeMarkers((uris) => {
      const model = editor.getModel();
      if (model) {
        const newMarkers = monaco.editor.getModelMarkers({ resource: model.uri });
        setMarkers(newMarkers);
      }
    });
  };

  const handleChange: OnChange = (value) => {
    onChange(value ?? "");
  };

  const handleValidate: OnValidate = (markers) => {
    // Handle validation markers
    setMarkers(markers);
  };

  return (
    <div className="editor-pane">
      <div className="editor-header">
        <TabsBar
          tabs={tabs}
          activePath={activePath}
          onSelect={onSelect}
          onClose={onClose}
        />
      </div>
      <Editor
        height="calc(100vh - 160px)"
        theme={theme === "dark" ? "vs-dark" : "vs-light"}
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        onValidate={handleValidate}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          roundedSelection: true,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnType: true,
          formatOnPaste: true,
          folding: true,
          foldingHighlight: true,
          guides: {
            indentation: true,
            bracketPairs: true
          },
          bracketPairColorization: {
            enabled: true
          },
          parameterHints: {
            enabled: true
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          suggest: {
            showKeywords: true,
            showFunctions: true,
            showClasses: true,
            showModules: true,
            showVariables: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showIssues: true
          }
        }}
      />
    </div>
  );
};

export default EditorPane;
