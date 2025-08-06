'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, LoaderCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { UploadingFile } from '../types'; // FIX: Import the interface from the correct types file

interface UploadProgressProps {
  files: UploadingFile[];
}

export default function UploadProgress({ files }: UploadProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <LoaderCircle size={16} className="animate-spin text-primary-accent" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
    }
  };

  return (
    <div className="flex-shrink-0 bg-foreground border-t border-border-color shadow-inner">
      <div className="p-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <h3 className="text-md font-semibold text-primary-text">
            Document Ingestion Progress ({files.filter(f => f.status !== 'completed').length} active)
          </h3>
          <button>
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {files.map((file) => (
              <div key={file.id}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-secondary-text truncate w-3/4">{file.name}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-muted-text">{file.progress}%</span>
                    {getStatusIcon(file.status)}
                  </div>
                </div>
                <div className="w-full bg-input-bg rounded-full h-2">
                  <div
                    className="bg-primary-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
                 <p className="text-xs text-muted-text mt-1 capitalize">{file.status}...</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
