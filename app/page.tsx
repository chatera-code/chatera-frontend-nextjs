'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatSessionsPanel from './components/ChatSessionsPanel';
import FileManagementPanel from './components/FileManagementPanel';
import ChatArea from './components/ChatArea';
import FileUploadModal from './components/FileUploadModal';
import { useUploadSocket } from './hooks/useUploadSocket';
import { useChatSocket } from './hooks/useChatSocket';
import { fetchUserDocuments, createNewSession, uploadDocuments } from './lib/api';
import { Document, Session } from './types';

export default function Home() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [refreshDocuments, setRefreshDocuments] = useState(false);
  
  const [uploadChannelId, setUploadChannelId] = useState<string | null>(null);
  const { inProgressFiles, isConnected: isUploadSocketConnected, setUploadCompleteCallback } = useUploadSocket(uploadChannelId);
  
  // FIX: The chat socket is now managed *only* here in the parent component.
  const { statusUpdate, setOnTitleUpdate } = useChatSocket(selectedSessionId);

  const clientId = "user_12345";

  const triggerDocumentRefresh = useCallback(() => {
    setRefreshDocuments(prev => !prev);
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      setOnTitleUpdate((newTitle: string) => {
        setSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === selectedSessionId ? { ...session, title: newTitle } : session
          )
        );
      });
    }
  }, [selectedSessionId, setOnTitleUpdate]);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const userDocs = await fetchUserDocuments(clientId);
        setDocuments(userDocs);
      } catch (error) { console.error("Failed to load documents:", error); }
    };
    loadDocs();
  }, [clientId, refreshDocuments]);

  useEffect(() => {
    setUploadCompleteCallback(() => {
        console.log('An upload completed, refreshing document list.');
        triggerDocumentRefresh();
    });
  }, [setUploadCompleteCallback, triggerDocumentRefresh]);

  const handleNewChat = async () => {
    try {
      const userDocs = await fetchUserDocuments(clientId);
      if (userDocs.length === 0) {
        setIsModalOpen(true);
      } else {
        const newSession = await createNewSession(clientId);
        setSessions(prev => [newSession, ...prev]);
        setSelectedSessionId(newSession.id);
        setSelectedDocs(new Set());
      }
    } catch (error) {
      console.error("Error starting new chat:", error);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    setIsModalOpen(false);
    const channelId = uuidv4();
    setUploadChannelId(channelId);
    
    setTimeout(async () => {
        try {
            await uploadDocuments(clientId, files, channelId);
        } catch (error) {
            console.error("Upload failed:", error);
        }
    }, 500);
  };
  
  const handleSelectSession = useCallback((id: string) => {
    setSelectedSessionId(id);
    setSelectedDocs(new Set());
  }, []);

  return (
    <div className="flex h-screen font-sans bg-background">
      <ChatSessionsPanel
        sessions={sessions}
        setSessions={setSessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        clientId={clientId}
      />
      
      <div className="flex-1 flex flex-col h-screen">
        <ChatArea 
            key={selectedSessionId}
            selectedSessionId={selectedSessionId} 
            selectedDocs={selectedDocs}
            clientId={clientId}
            statusUpdate={statusUpdate} // Pass the status update down as a prop
        />
      </div>
      
      <FileManagementPanel 
        documents={documents}
        inProgressFiles={inProgressFiles}
        onFileUpload={() => setIsModalOpen(true)}
        selectedDocs={selectedDocs}
        setSelectedDocs={setSelectedDocs}
        isNewChatMode={sessions.find(s => s.id === selectedSessionId)?.title === 'New Chat'}
        clientId={clientId}
        onDeleteSuccess={triggerDocumentRefresh}
      />

      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFileSelect={handleFileUpload}
      />
    </div>
  );
}
