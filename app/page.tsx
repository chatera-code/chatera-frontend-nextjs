'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileUp, Code2 } from 'lucide-react';
import ChatSessionsPanel from './components/ChatSessionsPanel';
import FileManagementPanel from './components/FileManagementPanel';
import ChatArea from './components/ChatArea';
import FileUploadModal from './components/FileUploadModal';
import { useUploadSocket } from './hooks/useUploadSocket';
import { useChatSocket } from './hooks/useChatSocket';
import { fetchUserDocuments, createNewSession, uploadDocuments, fetchChatSessions } from './lib/api';
import { Document, Session, CodeBlock, Message } from './types';
import GeneratedContentPanel from './components/GeneratedContentPanel';
import InteractiveCodeViewer from './components/InteractiveCodeViewer';

export default function Home() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [refreshDocuments, setRefreshDocuments] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [allCodeBlocks, setAllCodeBlocks] = useState<CodeBlock[]>([]);
  
  // State for right-side panels
  const [rightPanel, setRightPanel] = useState<'files' | 'code' | null>(null);
  const [activeCodeBlockId, setActiveCodeBlockId] = useState<string | null>(null);

  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);


  const [uploadChannelId, setUploadChannelId] = useState<string | null>(null);
  const { inProgressFiles, setUploadCompleteCallback } = useUploadSocket(uploadChannelId);
  
  const { statusUpdate, setOnTitleUpdate } = useChatSocket(selectedSessionId);

  const [isChatPanelPermanentlyOpen, setIsChatPanelPermanentlyOpen] = useState(false);

  const clientId = "user_12345";
  
  // Load canvas mode from localStorage on initial load
  useEffect(() => {
    const savedCanvasMode = localStorage.getItem('canvasMode');
    if (savedCanvasMode) {
      setIsCanvasMode(JSON.parse(savedCanvasMode));
    }
  }, []);

  // Save canvas mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('canvasMode', JSON.stringify(isCanvasMode));
  }, [isCanvasMode]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (isInitialLoad) {
        try {
          const fetchedSessions = await fetchChatSessions(clientId);
          setSessions(fetchedSessions);
          if (fetchedSessions.length > 0) {
            setSelectedSessionId(fetchedSessions[0].id);
          }
        } catch (error) {
          console.error("Failed to load initial sessions:", error);
        } finally {
          setIsInitialLoad(false);
        }
      }
    };
    loadInitialData();
  }, [clientId, isInitialLoad]);

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

  const handleNewChat = () => {
    setSelectedSessionId(null);
    setSelectedDocs(new Set());
    setRightPanel(null);
    setActiveCodeBlockId(null);
  };

  const handleSessionCreated = (newSession: Session) => {
    setSessions(prev => [newSession, ...prev]);
    setSelectedSessionId(newSession.id);
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
    setRightPanel(null);
    setActiveCodeBlockId(null);
  }, []);

  const handleNewCodeBlocks = (newBlocks: CodeBlock[], streaming: boolean) => {
    setAllCodeBlocks(prev => {
        const otherSessionBlocks = prev.filter(b => b.sessionId !== selectedSessionId);
        return [...otherSessionBlocks, ...newBlocks];
    });

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'ai' && lastMessage.canvasMode && streaming) {
      const latestBlock = newBlocks.find(b => !b.isComplete);
      if (latestBlock) {
          handleOpenCodeCanvas(latestBlock.id);
      }
    }
  };

  const handleOpenCodeCanvas = (id: string) => {
    setActiveCodeBlockId(id);
    setRightPanel(null);
  };

  const handleCloseCodeViewer = () => {
    setActiveCodeBlockId(null);
    setRightPanel('code'); 
  };
  
  const toggleCodePanel = () => {
    setActiveCodeBlockId(null);
    setRightPanel(prev => prev === 'code' ? null : 'code');
  };
  
  const toggleFilePanel = () => {
    setActiveCodeBlockId(null);
    setRightPanel(prev => prev === 'files' ? null : 'files');
  };

  const sessionCodeBlocks = allCodeBlocks.filter(b => b.sessionId === selectedSessionId);
  const activeCodeBlock = allCodeBlocks.find(b => b.id === activeCodeBlockId) || null;

  const isCanvasOpen = activeCodeBlockId !== null;
  const isRightPanelOpen = rightPanel !== null || isCanvasOpen;
  const mainContentWidth = isRightPanelOpen ? 'w-1/2' : 'w-full';
  const rightPanelWidth = isRightPanelOpen ? (isCanvasOpen ? 'w-1/2' : 'w-[320px]') : 'w-0';

  return (
    <div className="flex h-screen font-sans bg-background overflow-hidden">
      <ChatSessionsPanel
        sessions={sessions}
        setSessions={setSessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        clientId={clientId}
        isPermanentlyOpen={isChatPanelPermanentlyOpen}
        togglePermanentOpen={() => setIsChatPanelPermanentlyOpen(!isChatPanelPermanentlyOpen)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <main className={`flex-1 flex flex-col h-full relative transition-all duration-300 ease-in-out ${mainContentWidth}`}>
            <div className="absolute top-4 right-8 z-30 flex space-x-2">
                <button 
                    onClick={toggleCodePanel}
                    className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                >
                    <Code2 size={20} className="text-primary-text" />
                </button>
                <button 
                    onClick={toggleFilePanel}
                    className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                >
                    <FileUp size={20} className="text-primary-text" />
                </button>
            </div>
            <ChatArea 
                selectedSessionId={selectedSessionId} 
                selectedDocs={selectedDocs}
                clientId={clientId}
                statusUpdate={statusUpdate}
                onSessionCreated={handleSessionCreated}
                onNewCodeBlocks={handleNewCodeBlocks}
                isCanvasMode={isCanvasMode}
                setIsCanvasMode={setIsCanvasMode}
                onOpenCodeCanvas={handleOpenCodeCanvas}
                messages={messages}
                setMessages={setMessages}
            />
        </main>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${rightPanelWidth}`}>
            {isCanvasOpen && activeCodeBlock && (
                <InteractiveCodeViewer codeBlock={activeCodeBlock} onClose={handleCloseCodeViewer} />
            )}
            {rightPanel === 'code' && !isCanvasOpen && (
                <GeneratedContentPanel codeBlocks={sessionCodeBlocks} onSelectCodeBlock={handleOpenCodeCanvas} />
            )}
            {rightPanel === 'files' && !isCanvasOpen && (
                <FileManagementPanel 
                    documents={documents}
                    inProgressFiles={inProgressFiles}
                    onFileUpload={() => setIsModalOpen(true)}
                    selectedDocs={selectedDocs}
                    setSelectedDocs={setSelectedDocs}
                    isNewChatMode={!selectedSessionId}
                    clientId={clientId}
                    onDeleteSuccess={triggerDocumentRefresh}
                />
            )}
        </div>
      </div>
      
      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFileSelect={handleFileUpload}
      />
    </div>
  );
}
