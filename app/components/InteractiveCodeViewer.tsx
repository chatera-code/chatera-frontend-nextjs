'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { ghcolors } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X, Clipboard, Check, Download, Code, Eye } from 'lucide-react';
import { CodeBlock } from '../types';

interface InteractiveCodeViewerProps {
  codeBlock: CodeBlock;
  onClose: () => void;
}

const getFileExtension = (language: string) => {
    const map: { [key: string]: string } = {
        html: 'html',
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        dockerfile: 'Dockerfile',
        css: 'css',
        json: 'json',
        markdown: 'md',
    };
    return map[language.toLowerCase()] || 'txt';
};

export default function InteractiveCodeViewer({ codeBlock, onClose }: InteractiveCodeViewerProps) {
  const [view, setView] = useState<'code' | 'render'>('code');
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setView('code');
  }, [codeBlock.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeBlock.content);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };
  
  const handleExport = () => {
    const extension = getFileExtension(codeBlock.language);
    const filename = `chatera-code.${extension}`;
    const blob = new Blob([codeBlock.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isRenderable = codeBlock.language.toLowerCase() === 'html';

  return (
    <aside className="w-full bg-white flex flex-col h-full border-l border-border-color shadow-2xl">
      <div className="flex items-center justify-between p-3 border-b bg-sidebar-bg">
        <div className="flex items-center space-x-4">
          {isRenderable && (
            <div className="flex items-center bg-gray-200 rounded-md p-0.5">
              <button 
                onClick={() => setView('code')}
                className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center ${view === 'code' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <Code size={16} className="mr-2"/> Code
              </button>
              <button 
                onClick={() => setView('render')}
                disabled={!codeBlock.isComplete}
                className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center ${view === 'render' ? 'bg-white shadow-sm' : 'text-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Eye size={16} className="mr-2"/> Render
              </button>
            </div>
          )}
          <span className="text-sm font-semibold text-gray-700 uppercase">{codeBlock.language}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleCopy} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
            {hasCopied ? <Check size={16} className="text-green-600"/> : <Clipboard size={16}/>}
          </button>
          <button onClick={handleExport} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
            <Download size={16}/>
          </button>
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {view === 'code' || !isRenderable ? (
          <SyntaxHighlighter
            language={codeBlock.language}
            style={ghcolors}
            customStyle={{ height: '100%', margin: 0, fontSize: '1rem', overflowX: 'auto' }}
            showLineNumbers
          >
            {codeBlock.content}
          </SyntaxHighlighter>
        ) : (
          <iframe
            srcDoc={codeBlock.content}
            title="Rendered HTML"
            className="w-full h-full border-none"
            sandbox="allow-scripts"
          />
        )}
      </div>
    </aside>
  );
}
