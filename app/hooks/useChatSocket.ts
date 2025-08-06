'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Defines the structure for a status message from the backend
export interface StatusUpdate {
  type: 'status' | 'error';
  message: string;
}

// Defines the structure for a title update message
interface TitleUpdatePayload {
    type: 'title_update';
    new_title: string;
}

const WEBSOCKET_URL = 'ws://127.0.0.1:8000/ws';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useChatSocket = (channelId: string | null) => {
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onTitleUpdateRef = useRef<((newTitle: string) => void) | null>(null);

  const setOnTitleUpdate = useCallback((callback: (newTitle: string) => void) => {
    onTitleUpdateRef.current = callback;
  }, []);

  useEffect(() => {
    // If there's no channelId, do nothing and ensure we are disconnected.
    if (!channelId) {
      setIsConnected(false);
      return;
    }

    let socket: WebSocket | null = null;
    let retryCount = 0;
    let explicitClose = false;

    const connect = () => {
      socket = new WebSocket(`${WEBSOCKET_URL}/${channelId}`);

      socket.onopen = () => {
        console.log(`Chat WebSocket connected on channel: ${channelId}`);
        setIsConnected(true);
        retryCount = 0; // Reset retries on successful connection
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'status' || data.type === 'error') {
          setStatusUpdate(data as StatusUpdate);
        }
        if (data.type === 'title_update' && onTitleUpdateRef.current) {
          const payload = data as TitleUpdatePayload;
          onTitleUpdateRef.current(payload.new_title);
        }
      };

      socket.onclose = () => {
        console.log(`Chat WebSocket disconnected from channel: ${channelId}`);
        setIsConnected(false);
        // Don't retry if the connection was closed intentionally
        if (!explicitClose && retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying connection... Attempt ${retryCount}`);
          setTimeout(connect, RETRY_DELAY * retryCount);
        }
      };

      socket.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        // The onclose event will fire next, which will handle the retry logic.
      };
    };

    connect(); // Initial connection attempt

    // Cleanup function: This runs when channelId changes or the component unmounts.
    return () => {
      explicitClose = true;
      if (socket) {
        socket.close();
      }
    };
  }, [channelId]); // This effect ONLY re-runs when the channelId changes.

  return { statusUpdate, isConnected, setOnTitleUpdate };
};
