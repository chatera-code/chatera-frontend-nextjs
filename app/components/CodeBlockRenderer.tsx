'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { ghcolors } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clipboard, Check, Download, Code, Eye } from 'lucide-react';
import { CodeBlock } from '../types';

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

export default function CodeBlockRenderer({ codeBlock }: { codeBlock: CodeBlock }) {
  const [view, setView] = useState<'code' | 'render'>('code');
  const [hasCopied, setHasCopied] = useState(false);

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
    <div className="bg-white rounded-lg shadow-md w-full">
      <div className="flex items-center justify-between p-2 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          {isRenderable && (
            <div className="flex items-center bg-gray-200 rounded-md p-0.5">
              <button 
                onClick={() => setView('code')}
                className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center ${view === 'code' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <Code size={14} className="mr-1"/> Code
              </button>
              <button 
                onClick={() => setView('render')}
                disabled={!codeBlock.isComplete}
                className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center ${view === 'render' ? 'bg-white shadow-sm' : 'text-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Eye size={14} className="mr-1"/> Render
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={handleCopy} className="p-1 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
            {hasCopied ? <Check size={16} className="text-green-600"/> : <Clipboard size={16}/>}
          </button>
          <button onClick={handleExport} className="p-1 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
            <Download size={16}/>
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-auto">
        {view === 'code' || !isRenderable ? (
          <SyntaxHighlighter
            language={codeBlock.language}
            style={ghcolors}
            customStyle={{ margin: 0, fontSize: '0.875rem' }}
          >
            {codeBlock.content}
          </SyntaxHighlighter>
        ) : (
          <iframe
            srcDoc={codeBlock.content}
            title="Rendered HTML"
            className="w-full h-64 border-none"
            sandbox="allow-scripts"
          />
        )}
      </div>
    </div>
  );
}
