import { memo, useEffect, useState } from 'react';
import { Spinner } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

interface EnhancedLoadingSpinnerProps {
  message?: string;
  showProgress?: boolean;
  className?: string;
}

const loadingMessages = [
  'Connecting to AI model...',
  'Loading conversation history...',
  'Preparing response...',
  'Initializing tools...',
  'Processing your request...',
];

function EnhancedLoadingSpinner({
  message,
  showProgress = true,
  className = ''
}: EnhancedLoadingSpinnerProps) {
  const localize = useLocalize();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!showProgress) return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [showProgress]);

  const displayMessage = message || loadingMessages[currentMessageIndex];

  return (
    <div className={cn(
      "relative flex-1 overflow-hidden overflow-y-auto",
      className
    )}>
      <div className="relative flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4 max-w-sm mx-auto text-center">
          {/* Enhanced Spinner */}
          <div className="relative">
            <Spinner className="text-text-primary w-8 h-8" />
            {showProgress && (
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"
                   style={{ animationDuration: '2s' }} />
            )}
          </div>

          {/* Loading Message */}
          <div className="space-y-2">
            <p className="text-text-secondary font-medium animate-pulse">
              {displayMessage}
            </p>

            {/* Progress Bar */}
            {showProgress && (
              <div className="w-48 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress, 90)}%` }}
                />
              </div>
            )}

            {/* Progress Percentage */}
            {showProgress && (
              <p className="text-xs text-text-tertiary">
                {Math.round(Math.min(progress, 90))}%
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="mt-6 text-xs text-text-tertiary max-w-xs">
            <p>💡 Tip: You can use keyboard shortcuts to navigate faster</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EnhancedLoadingSpinner);