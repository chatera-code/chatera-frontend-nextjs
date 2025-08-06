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

export interface Message {
  type: 'user' | 'ai';
  text: string;
}

export interface UploadingFile {
  id: number;
  name: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}
