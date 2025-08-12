'use client';

import { CodeBlock } from '../types';
import { FileCode2 } from 'lucide-react';

interface GeneratedContentPanelProps {
  codeBlocks: CodeBlock[];
  onSelectCodeBlock: (id: string) => void;
}

export default function GeneratedContentPanel({ codeBlocks, onSelectCodeBlock }: GeneratedContentPanelProps) {
  if (codeBlocks.length === 0) {
    return (
      <aside className="w-[320px] bg-sidebar-bg p-4 flex flex-col h-full border-l border-border-color">
        <h2 className="text-lg font-semibold text-primary-text mb-4">Generated Files</h2>
        <div className="flex-grow flex items-center justify-center text-center">
          <p className="text-sm text-muted-text">No files have been generated in this session yet.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[320px] bg-sidebar-bg p-3 flex flex-col h-full border-l border-border-color">
      <h2 className="text-lg font-semibold text-primary-text mb-4 px-2">Generated Files</h2>
      <div className="flex-grow overflow-y-auto pr-1 space-y-2">
        {codeBlocks.map((block) => (
          <button
            key={block.id}
            onClick={() => onSelectCodeBlock(block.id)}
            className="w-full flex items-center p-3 rounded-lg text-left hover:bg-hover-accent transition-colors"
          >
            <FileCode2 size={20} className="mr-3 flex-shrink-0 text-primary-accent" />
            <p className="text-sm font-medium truncate flex-grow text-primary-text">{`code-block.${getFileExtension(block.language)}`}</p>
          </button>
        ))}
      </div>
    </aside>
  );
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
