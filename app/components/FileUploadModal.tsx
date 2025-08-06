'use client';

import { useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: File[]) => void; // Changed to accept an array of files
}

export default function FileUploadModal({ isOpen, onClose, onFileSelect }: FileUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(Array.from(files)); // Convert FileList to array
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if (pdfFiles.length > 0) {
        onFileSelect(pdfFiles);
      } else {
        alert('Please drop at least one PDF file.');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-foreground rounded-lg shadow-xl p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-text hover:text-primary-text">
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold text-primary-text mb-4">Upload PDF Documents</h2>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-card border-dashed-border bg-input-bg text-center hover:border-primary-accent transition-colors duration-200 cursor-pointer"
        >
          <UploadCloud size={48} className="text-primary-accent mb-4" />
          <p className="text-primary-text font-semibold">Drop PDFs here or click to browse</p>
          <p className="text-secondary-text text-sm mt-1">You can select multiple files</p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          multiple // Allow multiple file selection
          className="hidden"
        />

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-button text-secondary-text hover:bg-input-bg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
