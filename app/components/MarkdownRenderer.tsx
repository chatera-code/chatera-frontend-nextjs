'use client';

import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Code } from 'lucide-react';
import { CodeBlock } from '../types';

interface MarkdownRendererProps {
  content: string;
  codeBlocks?: CodeBlock[];
  isCanvasMode?: boolean;
  onOpenCodeCanvas?: (id: string) => void;
}

interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const getCellText = (cell: any): string => {
    if (cell && cell.type === 'element' && cell.children && cell.children.length > 0) {
        const textNode = cell.children[0];
        if (textNode && textNode.type === 'text') {
            return textNode.value;
        }
    }
    return '';
};

const toCsv = (table: string[][]): string => {
    return table.map(row => 
        row.map(cell => {
            const text = cell || '';
            if (text.includes(',') || text.includes('\n') || text.includes('"')) {
                return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        }).join(',')
    ).join('\n');
};

const handleExportToExcel = (table: string[][]) => {
    const csvContent = toCsv(table);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chatera-table.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export default function MarkdownRenderer({ content, codeBlocks = [], isCanvasMode, onOpenCodeCanvas }: MarkdownRendererProps) {
  
  const components: Components = {
    p: ({ children }) => <div className="mb-4">{children}</div>,
    code(props: CodeComponentProps) {
      const { node, inline, className, children, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : 'text';

      if (inline) {
        return <code className={className} {...rest}>{children}</code>;
      }

      const codeContent = String(children || '').trim();
      const block = codeBlocks.find(cb => cb.content.trim() === codeContent && cb.language === lang);

      // FIX for Bug #1: If in canvas mode and it's a code file (not 'txt'),
      // either show the "Open Canvas" button or nothing. Do not render inline.
      if (isCanvasMode && lang !== 'txt') {
        if (block && onOpenCodeCanvas) {
          return (
            <div className="my-4 rounded-md bg-blue-50 border border-blue-200 p-4 font-sans shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Code size={16} className="mr-2 text-blue-600" />
                  <span className="text-sm text-blue-800 font-semibold">{`code-block.${lang}`}</span>
                </div>
                <button 
                  onClick={() => onOpenCodeCanvas(block.id)}
                  className="text-sm flex items-center text-blue-600 hover:text-blue-800 transition-colors font-semibold"
                >
                  Open Canvas
                </button>
              </div>
            </div>
          );
        }
        // If block is not found or no handler, return null to prevent rendering anything.
        return null;
      }
      
      // Default rendering for when canvas mode is OFF, or for 'txt' blocks.
      return (
        <div className="my-4 rounded-md bg-sidebar-bg border border-border-color font-sans shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-border-color rounded-t-md">
            <span className="text-xs text-secondary-text font-semibold uppercase">{lang}</span>
          </div>
          <pre className="bg-white p-4 rounded-b-md text-sm overflow-x-auto">
            <code className={className} {...rest}>{children}</code>
          </pre>
        </div>
      );
    },
    table({ node, children, ...props }) {
        const tableData: string[][] = [];
        if (node && node.children) {
            node.children.forEach(child => {
                if (child.type === 'element' && (child.tagName === 'thead' || child.tagName === 'tbody')) {
                    child.children.forEach(row => {
                        if (row.type === 'element' && row.tagName === 'tr') {
                            const rowData = row.children
                                .filter(cell => cell.type === 'element' && (cell.tagName === 'th' || cell.tagName === 'td'))
                                .map(getCellText);
                            tableData.push(rowData);
                        }
                    });
                }
            });
        }

      return (
        <div className="my-4">
            <div className="flex justify-end mb-2">
                <button 
                    onClick={() => handleExportToExcel(tableData)}
                    className="flex items-center text-xs font-semibold text-gray-600 hover:text-black"
                >
                    <Download size={14} className="mr-1"/>
                    Export to Excel
                </button>
            </div>
            <table className="w-full border-collapse border border-border-color" {...props}>
                {children}
            </table>
        </div>
      );
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
        unwrapDisallowed={true} 
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}