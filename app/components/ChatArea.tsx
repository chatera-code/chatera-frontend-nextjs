'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, LoaderCircle, Zap, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message } from '../types';
import { fetchChatHistory, sendMessage } from '../lib/api';
import { useChatSocket } from '../hooks/useChatSocket';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatAreaProps {
  selectedSessionId: string | null;
  selectedDocs: Set<string>;
  clientId: string;
  statusUpdate: any;
}

export default function ChatArea({ selectedSessionId, selectedDocs, clientId, statusUpdate }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isInputDisabled = (messages.length === 0 && selectedDocs.size === 0) || isStreaming;

  useEffect(() => {
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
    if (!input.trim() || !selectedSessionId) return;

    const userMessage: Message = { type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    setMessages(prev => [...prev, { type: 'ai', text: '' }]);

    await sendMessage(
      { clientId, sessionId: selectedSessionId, message: input, documentIds: Array.from(selectedDocs) },
      (token) => {
        setMessages(prev => prev.map((msg, index) => 
            index === prev.length - 1 ? { ...msg, text: msg.text + token } : msg
        ));
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
    <main className="flex-1 flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between h-[60px] px-6 bg-foreground border-b border-border-color">
        <h1 className="text-lg font-semibold text-primary-text">
          {selectedSessionId ? `Conversation Details` : 'Select a conversation'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
            <div className="flex justify-center items-center h-full"><LoaderCircle className="animate-spin text-primary-accent" size={32} /></div>
        ) : (
            messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`break-words max-w-[80%] rounded-message-bubble ${
                    msg.type === 'user' 
                    ? 'bg-user-message-bg text-primary-text p-3 rounded-br-none' 
                    : 'bg-transparent text-primary-text p-0'
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

      <footer className="p-4 bg-foreground border-t border-border-color">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isInputDisabled ? "Processing..." : "Type your message..."}
            className="w-full h-[48px] pl-4 pr-14 rounded-chat-input bg-input-bg border border-dashed-border focus:outline-none focus:ring-2 focus:ring-primary-accent/50 focus:border-primary-accent transition-shadow disabled:bg-gray-200 disabled:cursor-not-allowed"
            disabled={isInputDisabled}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary-accent rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors disabled:bg-gray-400"
            disabled={isInputDisabled || !input.trim()}
          >
            {isStreaming ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </footer>
    </main>
  );
}
