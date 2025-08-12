// This file centralizes all shared data structures for the application.

export interface Document {
  id: string;
  name: string;
}

export interface Session {
  id: string;
  title: string;
  timestamp: string;
  isPinned: boolean;
}

export interface CodeBlock {
  id: string;
  sessionId: string;
  language: string;
  content: string;
  isComplete: boolean;
}

export type Message = 
  | { type: 'user'; text: string; }
  | { 
      type: 'ai'; 
      text: string; 
      thinkingEvents: string[]; 
      isThinkingVisible: boolean; 
      codeBlocks: CodeBlock[];
      canvasMode?: boolean; // Added to store canvas state per message
    };

export interface UploadingFile {
  id: number;
  name: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}
