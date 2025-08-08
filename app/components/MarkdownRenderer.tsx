'use client';

import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { ghcolors } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clipboard, Check } from 'lucide-react';
import { useState, ReactNode } from 'react';

// Define the props for the custom code renderer explicitly
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
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // If a language is specified (e.g., ```python), it's a block.
  // Otherwise, treat it as inline code.
  return match ? (
    <div className="my-4 rounded-md bg-sidebar-bg border border-border-color relative font-sans shadow-sm">
       <div className="flex items-center justify-between px-4 py-2 border-b border-border-color">
        <span className="text-xs text-secondary-text font-sans">{match[1]}</span>
        <button onClick={handleCopy} className="text-xs flex items-center text-secondary-text hover:text-primary-text transition-colors">
          {hasCopied ? <Check size={14} /> : <Clipboard size={14} />}
          <span className="ml-1.5">{hasCopied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={ghcolors}
        language={match[1]}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#F6F8FA' }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className="px-1.5 py-1 bg-gray-100 text-gray-800 font-mono text-sm rounded-md" {...props}>
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
        // This prop fixes the hydration error by preventing <p> tags from wrapping block elements.
        unwrapDisallowed={true} 
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
