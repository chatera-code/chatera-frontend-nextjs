'use client';

import { useState } from 'react';
import { File, UploadCloud, CheckSquare, Square, Trash2, ChevronDown, ChevronRight, LoaderCircle } from 'lucide-react';
import { Document } from '../types';
import { InProgressFile } from '../hooks/useUploadSocket';
import { deleteDocuments } from '../lib/api';

interface FileManagementPanelProps {
  documents: Document[];
  inProgressFiles: InProgressFile[];
  onFileUpload: () => void;
  selectedDocs: Set<string>;
  setSelectedDocs: React.Dispatch<React.SetStateAction<Set<string>>>;
  isNewChatMode: boolean;
  clientId: string;
  onDeleteSuccess: () => void;
}

export default function FileManagementPanel({ documents, inProgressFiles = [], onFileUpload, selectedDocs, setSelectedDocs, isNewChatMode, clientId, onDeleteSuccess }: FileManagementPanelProps) {
  const [docsToDelete, setDocsToDelete] = useState<Set<string>>(new Set());
  const [isProcessingExpanded, setIsProcessingExpanded] = useState(true);

  const handleChatSelectToggle = (docId: string) => {
    setSelectedDocs(prev => {
        const newSet = new Set(prev);
        if (newSet.has(docId)) newSet.delete(docId);
        else newSet.add(docId);
        return newSet;
    });
  };
  
  const handleDeleteSelectToggle = (docId: string) => {
    setDocsToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) newSet.delete(docId);
      else newSet.add(docId);
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (docsToDelete.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${docsToDelete.size} document(s)?`)) {
      try {
        await deleteDocuments(Array.from(docsToDelete), clientId);
        setDocsToDelete(new Set());
        onDeleteSuccess();
      } catch (error) {
        console.error("Failed to delete documents:", error);
        alert("Could not delete the selected documents. Please try again.");
      }
    }
  };
  return (
    <aside className="w-[300px] bg-sidebar-bg p-3 flex flex-col h-full border-l border-border-color rounded-l-2xl shadow-2xl">
        {documents.length === 0 && isNewChatMode && (
            <div className="p-4 mb-4 text-center bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg">
                <p className="font-bold">Welcome!</p>
                <p className="text-sm">To start a new chat, please upload a document first.</p>
            </div>
        )}
      <div onClick={onFileUpload} className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-card border-dashed-border bg-background text-center hover:border-primary-accent transition-colors duration-200 cursor-pointer mb-4">
        <UploadCloud size={32} className="text-secondary-text mb-2" />
        <p className="text-primary-text font-semibold">Upload Documents</p>
      </div>

      <div className="flex-grow overflow-y-auto pr-1">
        {inProgressFiles.length > 0 && (
          <div className="mb-6">
            <div onClick={() => setIsProcessingExpanded(!isProcessingExpanded)} className="flex items-center justify-between cursor-pointer mb-2 px-2">
              <h3 className="text-md font-semibold text-primary-text">Processing ({inProgressFiles.length})</h3>
              {isProcessingExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            {isProcessingExpanded && (
              <ul className="space-y-3">
                {inProgressFiles.map(file => (
                  <li key={file.doc_id} className="opacity-70 px-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center truncate">
                        <LoaderCircle size={16} className="animate-spin text-primary-accent mr-2" />
                        <p className="text-sm font-medium text-secondary-text truncate">{file.filename}</p>
                      </div>
                      <span className="text-xs font-mono text-muted-text">{file.progress}%</span>
                    </div>
                    <div className="w-full bg-input-bg rounded-full h-1.5">
                      <div className="bg-primary-accent h-1.5 rounded-full" style={{ width: `${file.progress}%` }}></div>
                    </div>
                    <p className="text-xs text-muted-text mt-1 truncate">{file.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-2 px-2">
          <h2 className="text-lg font-semibold text-primary-text">Your Documents</h2>
          {docsToDelete.size > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center text-sm text-red-500 hover:text-red-700 font-semibold">
              <Trash2 size={16} className="mr-1" />
              Delete ({docsToDelete.size})
            </button>
          )}
        </div>
        
        <ul className="space-y-1">
          {Array.isArray(documents) && documents.map((doc) => (
            <li 
              key={doc.id} 
              onClick={() => handleChatSelectToggle(doc.id)}
              className={`flex items-center p-3 rounded-lg group transition-all duration-200 cursor-pointer ${
                selectedDocs.has(doc.id) 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-hover-accent'
              }`}
            >
              <button onClick={(e) => { e.stopPropagation(); handleDeleteSelectToggle(doc.id); }} className="mr-2 p-1">
                {docsToDelete.has(doc.id) 
                  ? <CheckSquare size={20} className="text-red-500" /> 
                  : <Square size={20} className="text-muted-text" />}
              </button>
              <File size={20} className="mr-3 flex-shrink-0" />
              <p className={`text-sm font-medium truncate flex-grow ${selectedDocs.has(doc.id) ? 'text-blue-800' : 'text-primary-text'}`}>{doc.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}