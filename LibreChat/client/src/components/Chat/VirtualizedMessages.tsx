import { memo, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useRecoilValue } from 'recoil';
import type { TMessage } from 'librechat-data-provider';
import MultiMessage from './Messages/MultiMessage';
import TypingIndicator from './TypingIndicator';
import { cn } from '~/utils';
import store from '~/store';

interface VirtualizedMessagesProps {
  messagesTree: TMessage[] | null;
  isGenerating?: boolean;
  className?: string;
}

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: TMessage[];
    isGenerating: boolean;
  };
}

// Memoized message item component
const MessageItem = memo(({ index, style, data }: MessageItemProps) => {
  const { messages, isGenerating } = data;
  const message = messages[index];

  if (!message) return null;

  return (
    <div style={style} className="px-4">
      <MultiMessage
        messageId={message.messageId}
        messagesTree={messages}
        setCurrentEditId={() => {}}
        currentEditId={null}
        scrollableRef={null}
      />

      {/* Show typing indicator after the last message */}
      {index === messages.length - 1 && isGenerating && (
        <div className="mt-4">
          <TypingIndicator isVisible={true} />
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

function VirtualizedMessages({
  messagesTree,
  isGenerating = false,
  className = ''
}: VirtualizedMessagesProps) {
  const listRef = useRef<List>(null);
  const conversation = useRecoilValue(store.conversation);

  // Memoize messages to prevent unnecessary re-renders
  const messages = useMemo(() => {
    return messagesTree || [];
  }, [messagesTree]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  // Calculate dynamic item height based on message content
  const getItemSize = useMemo(() => {
    return (index: number) => {
      const message = messages[index];
      if (!message) return 100;

      // Base height
      let height = 80;

      // Add height for message content
      const contentLength = message.text?.length || 0;
      height += Math.min(contentLength / 50, 200); // Max 200px for content

      // Add height for files/attachments
      if (message.files && message.files.length > 0) {
        height += message.files.length * 40;
      }

      // Add height for typing indicator if it's the last message
      if (index === messages.length - 1 && isGenerating) {
        height += 80;
      }

      return Math.max(height, 60); // Minimum height
    };
  }, [messages, isGenerating]);

  if (!messages || messages.length === 0) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center",
        className
      )}>
        <div className="text-center space-y-4">
          <div className="text-4xl">💬</div>
          <p className="text-text-secondary">
            Start a conversation to see messages here
          </p>
        </div>
      </div>
    );
  }

  const itemData = {
    messages,
    isGenerating
  };

  return (
    <div className={cn("flex-1 relative", className)}>
      <List
        ref={listRef}
        height={window.innerHeight - 200} // Adjust based on header/footer
        itemCount={messages.length}
        itemSize={getItemSize}
        itemData={itemData}
        className="scrollbar-gutter-stable"
        style={{
          overflowX: 'hidden',
          scrollBehavior: 'smooth'
        }}
      >
        {MessageItem}
      </List>

      {/* Scroll to bottom button */}
      <button
        className={cn(
          "absolute bottom-4 right-4 bg-surface-primary border border-border-medium",
          "rounded-full p-2 shadow-lg transition-all duration-200",
          "hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-ring-primary",
          "opacity-0 pointer-events-none",
          // Show button when not at bottom
          messages.length > 5 && "opacity-100 pointer-events-auto"
        )}
        onClick={() => {
          if (listRef.current) {
            listRef.current.scrollToItem(messages.length - 1, 'end');
          }
        }}
        aria-label="Scroll to bottom"
      >
        <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </div>
  );
}

export default memo(VirtualizedMessages);