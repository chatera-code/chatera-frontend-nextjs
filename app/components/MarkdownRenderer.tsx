'use client';

import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clipboard, Check } from 'lucide-react';
import { useState, ReactNode } from 'react';

// FIX: Define the props for the custom code renderer explicitly
// This avoids the need for a deep import that can break between versions.
interface CustomCodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: ReactNode;
  [key: string]: any; // Allow other props
}

const CustomCodeRenderer = ({ node, inline, className, children, ...props }: CustomCodeProps) => {
  const [hasCopied, setHasCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  const handleCopy = () => {
    const codeToCopy = Array.isArray(children) ? String(children[0]) : '';
    navigator.clipboard.writeText(codeToCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return !inline && match ? (
    <div className="my-4 rounded-md bg-gray-800 text-white relative font-sans">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-600">
        <span className="text-xs text-gray-400">{language}</span>
        <button onClick={handleCopy} className="text-xs flex items-center text-gray-400 hover:text-white">
          {hasCopied ? <Check size={14} /> : <Clipboard size={14} />}
          <span className="ml-1">{hasCopied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto whitespace-pre-wrap break-words">
        <code className={`language-${language}`} {...props}>
          {children}
        </code>
      </pre>
    </div>
  ) : (
    <code className="px-1 py-0.5 bg-input-bg rounded-sm text-primary-accent" {...props}>
      {children}
    </code>
  );
};

export default function MarkdownRenderer({ content }: { content: string }) {
  
  const components: Components = {
    code: CustomCodeRenderer,
    table({ children }) {
      return <table className="w-full border-collapse border border-border-color">{children}</table>;
    },
    th({ children }) {
      return <th className="border border-border-color bg-input-bg p-2 text-left font-semibold">{children}</th>;
    },
    td({ children }) {
      return <td className="border border-border-color p-2">{children}</td>;
    },
  };

  return (
    <div className="prose prose-sm max-w-none text-primary-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
