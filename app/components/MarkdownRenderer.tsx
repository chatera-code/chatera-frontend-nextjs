'use client';

import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Maximize } from 'lucide-react';
import { CodeBlock } from '../types';

// Define the props for the component
interface MarkdownRendererProps {
  content: string;
  codeBlocks?: CodeBlock[];
  onOpenCodeCanvas?: (id: string) => void;
}

// Custom interface for code component props that includes inline property
interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

// Helper function to safely extract text from a cell (th or td)
const getCellText = (cell: any): string => {
    if (cell && cell.type === 'element' && cell.children && cell.children.length > 0) {
        const textNode = cell.children[0];
        if (textNode && textNode.type === 'text') {
            return textNode.value;
        }
    }
    return ''; // Return empty string for empty or complex cells
};

// Function to convert table data to CSV format
const toCsv = (table: string[][]): string => {
    return table.map(row => 
        row.map(cell => {
            const text = cell || '';
            // Escape quotes and wrap in quotes if it contains commas or newlines
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

export default function MarkdownRenderer({ content, codeBlocks = [], onOpenCodeCanvas }: MarkdownRendererProps) {
  
  const components: Components = {
    code(props: CodeComponentProps) {
      const { node, inline, className, children, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : 'text';
      const codeContent = String(children || '').trim();

      const block = codeBlocks.find(cb => cb.content.trim() === codeContent && cb.language === lang);

      if (!inline && block && onOpenCodeCanvas) {
        return (
          <div className="my-4 rounded-md bg-sidebar-bg border border-border-color p-4 font-sans shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-secondary-text font-semibold uppercase">{lang}</span>
              <button 
                onClick={() => onOpenCodeCanvas(block.id)}
                className="text-xs flex items-center text-secondary-text hover:text-primary-text transition-colors font-semibold"
              >
                <Maximize size={14} className="mr-1.5" />
                Open Interactive Canvas
              </button>
            </div>
            <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
              <code className={className} {...rest}>{children}</code>
            </pre>
          </div>
        );
      }

      return <code className={className} {...rest}>{children}</code>;
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