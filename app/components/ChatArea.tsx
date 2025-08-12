'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Send, LoaderCircle, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Message, Session, CodeBlock } from '../types';
import { fetchChatHistory, sendMessage, createNewSession } from '../lib/api';
import { useChatSocket } from '../hooks/useChatSocket';
import MarkdownRenderer from './MarkdownRenderer';
import Image from 'next/image';
import AnimatedBrain from './AnimatedBrain';

interface ChatAreaProps {
  selectedSessionId: string | null;
  selectedDocs: Set<string>;
  clientId: string;
  statusUpdate: any;
  onSessionCreated: (session: Session) => void;
  onNewCodeBlocks: (codeBlocks: CodeBlock[]) => void;
}

export default function ChatArea({ selectedSessionId, selectedDocs, clientId, statusUpdate, onSessionCreated, onNewCodeBlocks }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const justCreatedSessionRef = useRef(false);
  const lastProcessedEventId = useRef<string | null>(null);

  const isChatStarted = messages.length > 0;
  const isInputDisabled = isStreaming;

  useEffect(() => {
    if (justCreatedSessionRef.current) {
      justCreatedSessionRef.current = false;
      return;
    }

    if (selectedSessionId) {
      setIsLoading(true);
      const loadHistory = async () => {
        try {
          const history = await fetchChatHistory(selectedSessionId);
          const formattedHistory = history.map((msg: Message) => 
            msg.type === 'ai' ? { ...msg, thinkingEvents: [], isThinkingVisible: false, codeBlocks: parseCodeBlocks(msg.text, selectedSessionId) } : msg
          );
          setMessages(formattedHistory);
          onNewCodeBlocks(formattedHistory.flatMap(m => m.type === 'ai' ? m.codeBlocks : []));
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

  useEffect(() => {
    if (isStreaming && statusUpdate && statusUpdate.message) {
      const eventId = `${statusUpdate.timestamp}-${statusUpdate.message}`;
      if (lastProcessedEventId.current !== eventId) {
        lastProcessedEventId.current = eventId;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.type === 'ai') {
            lastMessage.thinkingEvents.push(statusUpdate.message);
          }
          return newMessages;
        });
      }
    }
  }, [statusUpdate, isStreaming]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { type: 'user', text: input };
    const messageText = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    setMessages(prev => [...prev, { type: 'ai', text: '', thinkingEvents: [], isThinkingVisible: false, codeBlocks: [] }]);

    let currentSessionId = selectedSessionId;

    if (!currentSessionId) {
      try {
        const title = messageText.substring(0, 50);
        const sessionFromApi = await createNewSession(clientId, { title });
        const newSessionForUi: Session = { ...sessionFromApi, title: title };
        justCreatedSessionRef.current = true; 
        onSessionCreated(newSessionForUi);
        currentSessionId = newSessionForUi.id;
      } catch (error) {
        setMessages(prev => prev.slice(0, -1).concat({ type: 'ai', text: `Error: Could not create a new chat session. ${error}`, thinkingEvents: [], isThinkingVisible: false, codeBlocks: [] }));
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
                const newText = lastMessage.text + token;
                const updatedCodeBlocks = parseCodeBlocks(newText, currentSessionId!);
                onNewCodeBlocks(updatedCodeBlocks);
                newMessages[newMessages.length - 1] = { ...lastMessage, text: newText, codeBlocks: updatedCodeBlocks };
            }
            return newMessages;
        });
      },
      () => { setIsStreaming(false); },
      (error) => {
        setMessages(prev => prev.slice(0, -1).concat({ type: 'ai', text: `Error: ${error.message}`, thinkingEvents: [], isThinkingVisible: false, codeBlocks: [] }));
        setIsStreaming(false);
      }
    );
  };

  const parseCodeBlocks = (text: string, sessionId: string): CodeBlock[] => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: CodeBlock[] = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        id: uuidv4(),
        sessionId,
        language: match[1] || 'text',
        content: match[2],
        isComplete: true,
      });
    }
    return blocks;
  };
  
  const handleToggleThinking = (index: number) => {
    setMessages(prev => 
      prev.map((msg, i) => {
        if (i === index && msg.type === 'ai') {
          return { ...msg, isThinkingVisible: !msg.isThinkingVisible };
        }
        return msg;
      })
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <div className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 h-8 w-full bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
        
        <div className={`px-6 pt-8 pb-56 space-y-4 w-full max-w-5xl mx-auto`}>
            {!isChatStarted && !selectedSessionId && (
                 <div className="flex flex-col justify-center items-center h-[calc(100vh-300px)]"></div>
            )}
            {isLoading ? (
            <div className="flex justify-center items-center h-full"><LoaderCircle className="animate-spin text-primary-accent" size={32} /></div>
            ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start items-start'}`}>
                {msg.type === 'ai' && (
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <Image src="/chatera-logo.svg" alt="Chatera Logo" width={32} height={32} />
                  </div>
                )}
                <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`break-words break-all rounded-message-bubble ${msg.type === 'user'
                      ? 'max-w-[80%] bg-user-message-bg text-primary-text p-3 rounded-br-none'
                      : 'max-w-full bg-transparent text-primary-text p-0'
                      }`}>
                      {msg.type === 'user' ? (
                        <p className="font-mono text-xl leading-relaxed">{msg.text}</p>
                      ) : (
                        <div className="w-full">
                          {(msg.thinkingEvents.length > 0 || (isStreaming && index === messages.length -1)) && (
                            <div className="mb-2 w-fit">
                              <button 
                                onClick={() => handleToggleThinking(index)} 
                                className="flex items-center text-xl text-gray-500 font-semibold"
                              >
                                <AnimatedBrain className="mr-2 h-6 w-6" isAnimating={isStreaming && index === messages.length -1} />
                                Thinking
                                {msg.isThinkingVisible ? <ChevronUp size={20} className="ml-1"/> : <ChevronDown size={20} className="ml-1"/>}
                              </button>
                              {msg.isThinkingVisible && (
                                <div className="mt-2 pl-4">
                                  {msg.thinkingEvents.map((event, eventIndex) => (
                                    <div key={eventIndex} className="relative pl-6 pb-4">
                                      <div className="absolute left-0 top-1.5 w-2 h-2 bg-gray-300 rounded-full"></div>
                                      {eventIndex < msg.thinkingEvents.length - 1 && (
                                        <div className="absolute left-[3px] top-[10px] w-0.5 h-full bg-gray-300"></div>
                                      )}
                                      <p className="italic text-gray-500 text-lg">{event}</p>
                                    </div>
                                  ))}
                                  {isStreaming && index === messages.length -1 && <LoaderCircle className="animate-spin text-primary-accent ml-6 mt-2" size={16} />}
                                </div>
                              )}
                            </div>
                          )}
                          <MarkdownRenderer content={msg.text} />
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className={`bg-background z-30 w-full max-w-5xl mx-auto self-center px-4 pb-4 ${!isChatStarted && !selectedSessionId ? 'absolute top-1/2 -translate-y-1/2' : 'sticky bottom-0'}`}>
        {!isChatStarted && !selectedSessionId && (
            <div className="text-center mb-4 flex items-center justify-center">
                <Image src="/chatera-logo.svg" alt="Chatera Logo" width={48} height={48} className="mr-3"/>
                <h2 className="text-3xl font-semibold text-gray-700">Hey, User</h2>
            </div>
        )}
        <div>
            <form onSubmit={handleSendMessage} className="relative">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"How may I help you today?"}
                className="w-full p-4 pr-14 text-2xl resize-none disabled:cursor-not-allowed h-32 rounded-3xl bg-background border border-gray-400 focus:outline-none focus:ring-0 disabled:bg-background"
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
            <p className={`text-center text-xs text-muted-text mt-2 transition-opacity duration-500 ${isChatStarted || selectedSessionId ? 'opacity-100' : 'opacity-0'}`}>
            AI can make mistakes. Consider checking important information.
            </p>
        </div>
      </footer>
    </div>
  );
}
