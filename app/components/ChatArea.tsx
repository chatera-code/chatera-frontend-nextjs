'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, LoaderCircle, Zap, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message, Session } from '../types';
import { fetchChatHistory, sendMessage, createNewSession } from '../lib/api';
import { useChatSocket } from '../hooks/useChatSocket';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatAreaProps {
  selectedSessionId: string | null;
  selectedDocs: Set<string>;
  clientId: string;
  statusUpdate: any;
  onSessionCreated: (session: Session) => void;
}

export default function ChatArea({ selectedSessionId, selectedDocs, clientId, statusUpdate, onSessionCreated }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const justCreatedSessionRef = useRef(false);

  const isChatStarted = messages.length > 0;
  const isInputDisabled = isStreaming;

  useEffect(() => {
    // This flag prevents the effect from running and wiping the message state
    // right after a new session has been created.
    if (justCreatedSessionRef.current) {
      justCreatedSessionRef.current = false;
      return;
    }

    if (selectedSessionId) {
      setIsLoading(true);
      const loadHistory = async () => {
        try {
          const history = await fetchChatHistory(selectedSessionId);
          setMessages(history);
        } catch (error) {
          console.error("Failed to load chat history:", error);
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadHistory();
    } else {
      setMessages([]);
      setIsLoading(false);
    }
  }, [selectedSessionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { type: 'user', text: input };
    const messageText = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    setMessages(prev => [...prev, { type: 'ai', text: '' }]);

    let currentSessionId = selectedSessionId;

    if (!currentSessionId) {
      try {
        const title = messageText.substring(0, 50);
        const sessionFromApi = await createNewSession(clientId, { title });
        
        // Create a new session object on the client to ensure the title is correct,
        // even if the backend defaults to "New Chat" initially.
        const newSessionForUi: Session = {
            ...sessionFromApi,
            title: title,
        };
        
        // Set the flag before updating the parent state to prevent the effect from running
        justCreatedSessionRef.current = true; 
        onSessionCreated(newSessionForUi);
        currentSessionId = newSessionForUi.id;
      } catch (error) {
        setMessages(prev => prev.map((msg, index) =>
          index === prev.length - 1 ? { ...msg, text: `Error: Could not create a new chat session. ${error}` } : msg
        ));
        setIsStreaming(false);
        return;
      }
    }

    await sendMessage(
      { clientId, sessionId: currentSessionId, message: messageText, documentIds: Array.from(selectedDocs) },
      (token) => {
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.type === 'ai') {
                newMessages[newMessages.length - 1] = { ...lastMessage, text: lastMessage.text + token };
            }
            return newMessages;
        });
      },
      () => { setIsStreaming(false); },
      (error) => {
        setMessages(prev => prev.map((msg, index) =>
          index === prev.length - 1 ? { ...msg, text: `Error: ${error.message}` } : msg
        ));
        setIsStreaming(false);
      }
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, statusUpdate]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-background relative">
      <header className="flex items-center justify-between h-[60px] px-6 bg-background flex-shrink-0 z-10">
        <h1 className="text-lg font-semibold text-primary-text">
          {selectedSessionId ? `Conversation Details` : 'New Conversation'}
        </h1>
      </header>
      <div
  className={`flex-1 overflow-y-auto px-6 pt-[92px] ${isChatStarted ? 'pb-48' : ''} space-y-4 w-full max-w-3xl mx-auto transition-all duration-1000`}
>


        {isLoading ? (
          <div className="flex justify-center items-center h-full"><LoaderCircle className="animate-spin text-primary-accent" size={32} /></div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`break-words break-all rounded-message-bubble ${msg.type === 'user'
                ? 'max-w-[80%] bg-user-message-bg text-primary-text p-3 rounded-br-none'
                : 'max-w-full bg-transparent text-primary-text p-0'
                }`}>
                {msg.type === 'ai' ? (
                  <MarkdownRenderer content={msg.text} />
                ) : (
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                )}
              </div>
              {msg.type === 'ai' && msg.text && !isStreaming && (
                <div className="flex items-center space-x-2 mt-2 ml-2">
                  <button className="p-1 text-muted-text hover:text-primary-accent transition-colors rounded-full">
                    <ThumbsUp size={16} />
                  </button>
                  <button className="p-1 text-muted-text hover:text-red-500 transition-colors rounded-full">
                    <ThumbsDown size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {isStreaming && statusUpdate && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 text-gray-600 shadow-sm animate-pulse">
              <div className="flex items-center text-sm">
                <Zap size={16} className="mr-2 text-gray-400" />
                <span>{statusUpdate.message}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- MODIFICATION: Shortened the overlay and tightened the gradient for a much cleaner effect --- */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-24 bg-gradient-to-t from-background to-transparent backdrop-blur-sm z-[5] pointer-events-none transition-opacity duration-500 ${isChatStarted ? 'opacity-100' : 'opacity-0'}`} />
<div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-full max-w-3xl h-[32px] 
  bg-background pointer-events-none z-10" />
      <footer className={`bg-background transition-all duration-1000 ease-in-out z-10 w-full max-w-3xl absolute left-1/2 ${isChatStarted ? 'top-full -translate-x-1/2 -translate-y-full' : 'top-1/2 -translate-x-1/2 -translate-y-1/2'}`}>
        <form onSubmit={handleSendMessage} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Type your message..."}
            className="w-full p-4 pr-14 resize-none transition-all duration-300 disabled:cursor-not-allowed h-32 rounded-3xl bg-background border shadow-2xl disabled:bg-background"
            disabled={isInputDisabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary-accent rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors disabled:bg-gray-400"
            disabled={isInputDisabled || !input.trim()}
          >
            {isStreaming ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
        <p className={`text-center text-xs text-muted-text mt-2 transition-opacity duration-500 ${isChatStarted ? 'opacity-100' : 'opacity-0'}`}>
          AI can make mistakes. Consider checking important information.
        </p>
      </footer>
    </div>
  );
}
