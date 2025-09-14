"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, File, X, Download } from 'lucide-react';

interface FileUploadProps {
  value?: string; // Current file URL
  onUpload?: (url: string) => void; // Callback when file is uploaded
  onRemove?: () => void; // Callback when file is removed
  disabled?: boolean;
  maxSize?: number; // Max file size in MB (default: 10)
}

export function FileUpload({ 
  value, 
  onUpload, 
  onRemove, 
  disabled = false,
  maxSize = 10 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSize * 1024 * 1024;

  const handleFiles = async (files: FileList) => {
    if (files.length === 0 || disabled) return;
    
    const file = files[0];
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, TXT');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      onUpload?.(result.url);
      toast.success('File uploaded successfully!');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) handleFiles(files);
  };

  const handleRemove = () => {
    onRemove?.();
    toast.info('File removed');
  };

  const getFileName = (url: string) => {
    try {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const fileName = lastPart.split('_').slice(2).join('_') || lastPart;
      return decodeURIComponent(fileName);
    } catch {
      return 'Document';
    }
  };

  const openFile = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-2">
      <Label className="text-zinc-300">Attachment (Optional)</Label>
      
      {value ? (
        // File already uploaded
        <div className="flex items-center justify-between p-3 bg-zinc-700 border border-zinc-600 rounded-md">
          <div className="flex items-center space-x-2">
            <File className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-300 text-sm truncate max-w-48">
              {getFileName(value)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => openFile(value)}
              className="h-8 w-8 p-0 hover:bg-zinc-600"
              disabled={disabled}
            >
              <Download className="h-4 w-4 text-zinc-400" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 hover:bg-zinc-600 hover:text-red-400"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // Upload area
        <div>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive 
                ? 'border-purple-400 bg-purple-400/10' 
                : 'border-zinc-600 bg-zinc-700/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-zinc-500'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={disabled}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            />
            
            <Upload className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
            <p className="text-zinc-300 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-zinc-500 text-sm">
              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT (max {maxSize}MB)
            </p>
          </div>
          
          {isUploading && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}