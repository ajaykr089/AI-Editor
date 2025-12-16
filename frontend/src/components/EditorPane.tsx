import Editor, { OnMount } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

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
};

const EditorPane = ({ value, onChange, language, filePath, onRequestAutocomplete, theme, onCursorChange }: Props) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const autocompleteDisposable = useRef<any>(null);

  useEffect(() => {
    if (!monacoRef.current) return;
    // re-register provider when language changes
    autocompleteDisposable.current?.dispose?.();
    autocompleteDisposable.current = monacoRef.current.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['.', ' ', '(', "'", '"'],
      provideCompletionItems: async (model: any, position: any) => {
        const text = model.getValue();
        const { lineNumber, column } = position;
        const response = await onRequestAutocomplete({ content: text, line: lineNumber, column });
        const suggestions = response.suggestions.map((label, idx) => ({
          label,
          kind: monacoRef.current.languages.CompletionItemKind.Snippet,
          insertText: label,
          range: undefined,
          sortText: `0${idx}`,
        }));
        return { suggestions };
      },
    });
  }, [language, onRequestAutocomplete]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange({ line: e.position.lineNumber, column: e.position.column });
    });
  };

  return (
    <div className="editor-pane">
      <div className="editor-header">
        <span>{filePath}</span>
        <span className="chip">{language}</span>
      </div>
      <Editor
        height="calc(100vh - 160px)"
        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
        language={language}
        value={value}
        onChange={(val) => onChange(val ?? '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};

export default EditorPane;

