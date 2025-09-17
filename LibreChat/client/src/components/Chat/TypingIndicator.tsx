import { memo, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { cn } from '~/utils';
import store from '~/store';

interface TypingIndicatorProps {
  isVisible: boolean;
  aiName?: string;
  className?: string;
}

function TypingIndicator({
  isVisible,
  aiName = 'AI',
  className = ''
}: TypingIndicatorProps) {
  const [dots, setDots] = useState('');
  const conversation = useRecoilValue(store.conversation);

  useEffect(() => {
    if (!isVisible) {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const modelName = conversation?.model || aiName;

  return (
    <div className={cn(
      "flex items-center space-x-3 p-4 rounded-lg bg-surface-secondary/50",
      "border border-border-medium transition-all duration-300",
      "animate-fade-in",
      className
    )}>
      {/* AI Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {modelName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Typing Animation */}
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
               style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
               style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
               style={{ animationDelay: '300ms' }} />
        </div>

        <span className="text-text-secondary text-sm ml-3">
          {modelName} is thinking{dots}
        </span>
      </div>

      {/* Pulse Effect */}
      <div className="flex-shrink-0">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export default memo(TypingIndicator);