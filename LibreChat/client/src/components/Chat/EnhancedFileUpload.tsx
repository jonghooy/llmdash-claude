import { memo, useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '~/utils';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface EnhancedFileUploadProps {
  onFilesUpload: (files: File[]) => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  className?: string;
}

function EnhancedFileUpload({
  onFilesUpload,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = ['image/*', 'application/pdf', 'text/*'],
  maxFiles = 5,
  className = ''
}: EnhancedFileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<Map<string, FileUploadProgress>>(new Map());
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = useCallback(async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;

    // Initialize progress
    setUploadProgress(prev => new Map(prev).set(fileId, {
      file,
      progress: 0,
      status: 'uploading'
    }));

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));

        setUploadProgress(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(fileId);
          if (current) {
            newMap.set(fileId, {
              ...current,
              progress
            });
          }
          return newMap;
        });
      }

      // Mark as completed
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(fileId);
        if (current) {
          newMap.set(fileId, {
            ...current,
            status: 'completed'
          });
        }
        return newMap;
      });

      // Remove from progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }, 2000);

    } catch (error) {
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(fileId);
        if (current) {
          newMap.set(fileId, {
            ...current,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          });
        }
        return newMap;
      });
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Filter files
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxFileSize) {
        console.warn(`File ${file.name} is too large (${file.size} bytes)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Start upload simulation for each file
    validFiles.forEach(simulateUpload);

    // Call parent handler
    onFilesUpload(validFiles);
  }, [maxFileSize, onFilesUpload, simulateUpload]);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxFileSize,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const progressEntries = Array.from(uploadProgress.values());

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          "hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20",
          isDragActive || dropzoneActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
            : "border-border-medium bg-surface-secondary/30"
        )}
      >
        <input {...getInputProps()} ref={fileInputRef} />

        <div className="space-y-3">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <svg
              className={cn(
                "w-12 h-12 transition-colors",
                isDragActive || dropzoneActive
                  ? "text-blue-500"
                  : "text-text-tertiary"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Upload Text */}
          <div>
            <p className="text-text-primary font-medium">
              {isDragActive || dropzoneActive
                ? "Drop files here..."
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-sm text-text-tertiary mt-1">
              Up to {maxFiles} files, {Math.round(maxFileSize / 1024 / 1024)}MB each
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              Supports: Images, PDFs, Text files
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {progressEntries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">
            Uploading Files ({progressEntries.length})
          </h4>

          {progressEntries.map((item, index) => (
            <div
              key={`${item.file.name}-${index}`}
              className="bg-surface-secondary rounded-lg p-3 border border-border-light"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {item.status === 'completed' ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : item.status === 'error' ? (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="text-xs">
                  {item.status === 'completed' && (
                    <span className="text-green-600 font-medium">Completed</span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-600 font-medium">Failed</span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="text-blue-600 font-medium">{item.progress}%</span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {item.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {/* Error Message */}
              {item.status === 'error' && item.error && (
                <p className="text-xs text-red-600 mt-1">{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(EnhancedFileUpload);