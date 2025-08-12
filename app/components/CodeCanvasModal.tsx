'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { ghcolors } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X, Clipboard, Check, Download, Code, Eye } from 'lucide-react';
import { CodeBlock } from '../types';

interface CodeCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeBlock: CodeBlock | null;
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


export default function CodeCanvasModal({ isOpen, onClose, codeBlock }: CodeCanvasModalProps) {
  const [view, setView] = useState<'code' | 'render'>('code');
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    // Reset to code view whenever a new code block is opened
    setView('code');
  }, [codeBlock]);

  if (!isOpen || !codeBlock) return null;

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-sidebar-bg rounded-t-lg">
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
            <button onClick={handleCopy} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors flex items-center text-sm">
              {hasCopied ? <Check size={16} className="mr-2 text-green-600"/> : <Clipboard size={16} className="mr-2"/>}
              {hasCopied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleExport} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors flex items-center text-sm">
              <Download size={16} className="mr-2"/> Export
            </button>
            <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {view === 'code' ? (
            <SyntaxHighlighter
              language={codeBlock.language}
              style={ghcolors}
              customStyle={{ height: '100%', margin: 0, fontSize: '1rem' }}
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
      </div>
    </div>
  );
}
