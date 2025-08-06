'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// This interface defines the structure of a file being processed.
export interface InProgressFile {
  doc_id: string; // The unique ID from the backend for this document
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number;
}

// This interface defines the structure of the WebSocket message from your backend.
interface WebSocketPayload {
  type: 'upload_progress';
  doc_id: string;
  filename: string;
  status: string;
  message: string;
  current_chunk?: number;
  total_chunks?: number;
}

const WEBSOCKET_URL = 'ws://127.0.0.1:8000/ws';

export const useUploadSocket = (channelId: string | null) => {
  const [inProgressFiles, setInProgressFiles] = useState<InProgressFile[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const onUploadCompleteRef = useRef<(() => void) | null>(null);

  const setUploadCompleteCallback = useCallback((callback: () => void) => {
    onUploadCompleteRef.current = callback;
  }, []);

  useEffect(() => {
    if (!channelId) {
      return;
    }

    const socket = new WebSocket(`${WEBSOCKET_URL}/${channelId}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log(`WebSocket connected on channel: ${channelId}`);
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data: WebSocketPayload = JSON.parse(event.data);

      if (data.type === 'upload_progress') {
        setInProgressFiles(prevFiles => {
          const existingFileIndex = prevFiles.findIndex(f => f.doc_id === data.doc_id);
          const progress = (data.current_chunk && data.total_chunks)
            ? Math.round((data.current_chunk / data.total_chunks) * 100)
            : (data.status === 'completed' ? 100 : 0);

          const updatedFile: InProgressFile = {
            doc_id: data.doc_id,
            filename: data.filename,
            status: data.status as InProgressFile['status'],
            message: data.message,
            progress: progress,
          };

          if (existingFileIndex > -1) {
            // Update existing file
            const newFiles = [...prevFiles];
            newFiles[existingFileIndex] = updatedFile;
            return newFiles;
          } else {
            // Add new file
            return [...prevFiles, updatedFile];
          }
        });

        // If all files are complete, trigger the callback
        if (data.status === 'completed') {
            // A slight delay to ensure the UI updates before refreshing the main list
            setTimeout(() => {
                if (onUploadCompleteRef.current) {
                    onUploadCompleteRef.current();
                }
                 // Remove the completed file from the in-progress list
                setInProgressFiles(prev => prev.filter(f => f.doc_id !== data.doc_id));
            }, 1000);
        }
      }
    };

    socket.onclose = () => {
      console.log(`WebSocket disconnected from channel: ${channelId}`);
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    // Cleanup on component unmount
    return () => {
      socket.close();
    };
  }, [channelId]);

  return { inProgressFiles, isConnected, setUploadCompleteCallback };
};
