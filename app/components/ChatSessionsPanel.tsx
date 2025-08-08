'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, MoreHorizontal, Pin, Trash2, Pencil, Menu, SquarePen } from 'lucide-react';
import { Session } from '../types';
import { updateSession, deleteSession } from '../lib/api';

const AnimatedTitle = ({ title }: { title: string }) => {
  const [displayedTitle, setDisplayedTitle] = useState(title);
  useEffect(() => { setDisplayedTitle(title); }, [title]);
  return <p className="text-sm font-semibold truncate">{displayedTitle}</p>;
};

interface ChatSessionsPanelProps {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  clientId: string;
  isPermanentlyOpen: boolean;
  togglePermanentOpen: () => void;
}

export default function ChatSessionsPanel({ sessions, setSessions, selectedSessionId, onSelectSession, onNewChat, clientId, isPermanentlyOpen, togglePermanentOpen }: ChatSessionsPanelProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isExpanded = isPermanentlyOpen || isHovered;

  // Effect to handle clicks outside of the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const handleToggleClick = () => {
    togglePermanentOpen();
    if (isPermanentlyOpen) {
      setIsHovered(false);
    }
  };
  
  const handlePinToggle = async (session: Session) => {
    const originalSessions = sessions;
    const newPinnedStatus = !session.isPinned;
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, isPinned: newPinnedStatus } : s));
    setActiveDropdown(null);
    try {
      await updateSession(session.id, { isPinned: newPinnedStatus });
    } catch (error) {
      console.error("Failed to pin session:", error);
      setSessions(originalSessions);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      const originalSessions = sessions;
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setActiveDropdown(null);
      try {
        await deleteSession(sessionId);
      } catch (error) {
        console.error("Failed to delete session:", error);
        setSessions(originalSessions);
      }
    }
  };

  const handleRename = async (session: Session) => {
    const newTitle = prompt('Enter new chat title:', session.title);
    if (newTitle && newTitle !== session.title) {
      const originalSessions = sessions;
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, title: newTitle } : s));
      setActiveDropdown(null);
      try {
        await updateSession(session.id, { title: newTitle });
      } catch (error) {
        console.error("Failed to rename session:", error);
        setSessions(originalSessions);
      }
    }
  };

  const sortedSessions = Array.isArray(sessions)
    ? [...sessions].sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
    : [];

  return (
    <aside 
      className={`bg-sidebar-bg p-3 flex flex-col h-screen border-r border-border-color transition-all duration-300 ease-in-out z-20 ${isExpanded ? 'w-[280px]' : 'w-[68px]'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col space-y-2 mb-4">
         <button onClick={handleToggleClick} className="flex items-center justify-center h-[44px] w-[44px] text-primary-text hover:bg-hover-accent rounded-button transition-colors duration-200">
            <Menu size={20} />
        </button>
        <button onClick={onNewChat} className={`flex items-center h-[44px] text-primary-text rounded-button font-semibold hover:bg-hover-accent transition-all duration-200 ease-in-out ${isExpanded ? 'w-full px-4 justify-start' : 'w-[44px] justify-center'}`}>
          <SquarePen size={20} />
          {isExpanded && <span className="ml-3 whitespace-nowrap">New Chat</span>}
        </button>
      </div>

      {isExpanded && (
        <div className="flex-grow overflow-y-auto pr-1">
          <ul className="space-y-1">
            {sortedSessions.map((session) => (
              <li
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`relative p-3 rounded-lg group transition-all duration-200 cursor-pointer ${
                  selectedSessionId === session.id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-hover-accent text-primary-text'
                }`}
              >
                <div className="flex items-center justify-between pr-6">
                  <div className="flex items-center truncate">
                    {session.isPinned && <Pin size={14} className="mr-2 flex-shrink-0" />}
                    <AnimatedTitle title={session.title} />
                  </div>
                  <span className="text-xs text-muted-text flex-shrink-0 ml-2">{new Date(session.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === session.id ? null : session.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-border-color transition-opacity"
                >
                  <MoreHorizontal size={18} className="text-muted-text" />
                </button>
                
                {activeDropdown === session.id && (
                  <div ref={dropdownRef} className="absolute right-4 top-12 z-10 w-40 bg-foreground rounded-md shadow-lg border border-border-color">
                    <ul className="py-1 text-sm text-primary-text">
                      <li onClick={(e) => { e.stopPropagation(); handlePinToggle(session); }} className="px-3 py-1.5 hover:bg-input-bg flex items-center cursor-pointer">
                        <Pin size={14} className="mr-2" /> {session.isPinned ? 'Unpin' : 'Pin Chat'}
                      </li>
                      <li onClick={(e) => { e.stopPropagation(); handleRename(session); }} className="px-3 py-1.5 hover:bg-input-bg flex items-center cursor-pointer">
                        <Pencil size={14} className="mr-2" /> Rename
                      </li>
                      <li onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }} className="px-3 py-1.5 hover:bg-input-bg flex items-center text-red-500 cursor-pointer">
                        <Trash2 size={14} className="mr-2" /> Delete
                      </li>
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
