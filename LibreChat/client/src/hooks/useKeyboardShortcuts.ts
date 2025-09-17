import { useEffect, useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import store from '~/store';

interface KeyboardShortcutsConfig {
  enableGlobalShortcuts?: boolean;
  enableChatShortcuts?: boolean;
  enableNavigationShortcuts?: boolean;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig = {}) {
  const {
    enableGlobalShortcuts = true,
    enableChatShortcuts = true,
    enableNavigationShortcuts = true
  } = config;

  const navigate = useNavigate();
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useRecoilState(store.showKeyboardShortcuts);
  const isSubmitting = useRecoilValue(store.isSubmitting);

  const handleKeyboardShortcut = useCallback((event: KeyboardEvent) => {
    const { key, metaKey, ctrlKey, shiftKey, altKey, target } = event;
    const isInputElement = target instanceof HTMLInputElement ||
                          target instanceof HTMLTextAreaElement ||
                          (target as HTMLElement)?.isContentEditable;

    // Don't trigger shortcuts when typing in input fields (except for specific cases)
    if (isInputElement && !metaKey && !ctrlKey && !altKey) {
      return;
    }

    const modifier = metaKey || ctrlKey; // Cmd on Mac, Ctrl on Windows/Linux

    // Global shortcuts
    if (enableGlobalShortcuts) {
      // Show keyboard shortcuts help (Cmd/Ctrl + ?)
      if (modifier && shiftKey && key === '?') {
        event.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }

      // Focus search (Cmd/Ctrl + K)
      if (modifier && key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Toggle sidebar (Cmd/Ctrl + B)
      if (modifier && key === 'b') {
        event.preventDefault();
        const sidebarToggle = document.querySelector('[data-sidebar-toggle]') as HTMLButtonElement;
        if (sidebarToggle) {
          sidebarToggle.click();
        }
        return;
      }

      // New conversation (Cmd/Ctrl + N)
      if (modifier && key === 'n') {
        event.preventDefault();
        navigate('/chat/new');
        return;
      }
    }

    // Navigation shortcuts
    if (enableNavigationShortcuts) {
      // Go to conversations (Cmd/Ctrl + 1)
      if (modifier && key === '1') {
        event.preventDefault();
        navigate('/chat');
        return;
      }

      // Go to agents (Cmd/Ctrl + 2)
      if (modifier && key === '2') {
        event.preventDefault();
        navigate('/chat/agents');
        return;
      }

      // Go to settings (Cmd/Ctrl + ,)
      if (modifier && key === ',') {
        event.preventDefault();
        const settingsButton = document.querySelector('[data-settings-button]') as HTMLButtonElement;
        if (settingsButton) {
          settingsButton.click();
        }
        return;
      }
    }

    // Chat shortcuts
    if (enableChatShortcuts) {
      // Send message (Cmd/Ctrl + Enter when in textarea)
      if (modifier && key === 'Enter' && isInputElement) {
        event.preventDefault();
        const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement;
        if (sendButton && !isSubmitting) {
          sendButton.click();
        }
        return;
      }

      // Stop generation (Escape)
      if (key === 'Escape' && isSubmitting) {
        event.preventDefault();
        const stopButton = document.querySelector('[data-stop-button]') as HTMLButtonElement;
        if (stopButton) {
          stopButton.click();
        }
        return;
      }

      // Focus message input (/)
      if (key === '/' && !isInputElement) {
        event.preventDefault();
        const messageInput = document.querySelector('[data-message-input]') as HTMLTextAreaElement;
        if (messageInput) {
          messageInput.focus();
        }
        return;
      }

      // Scroll to bottom (Cmd/Ctrl + End)
      if (modifier && key === 'End') {
        event.preventDefault();
        const scrollToBottomButton = document.querySelector('[data-scroll-to-bottom]') as HTMLButtonElement;
        if (scrollToBottomButton) {
          scrollToBottomButton.click();
        } else {
          // Fallback: scroll to bottom manually
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
        return;
      }

      // Scroll to top (Cmd/Ctrl + Home)
      if (modifier && key === 'Home') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // File upload (Cmd/Ctrl + U)
    if (modifier && key === 'u') {
      event.preventDefault();
      const fileUploadButton = document.querySelector('[data-file-upload]') as HTMLButtonElement;
      if (fileUploadButton) {
        fileUploadButton.click();
      }
      return;
    }

    // Copy last response (Cmd/Ctrl + Shift + C)
    if (modifier && shiftKey && key === 'C') {
      event.preventDefault();
      const lastMessage = document.querySelector('[data-message]:last-child [data-copy-button]') as HTMLButtonElement;
      if (lastMessage) {
        lastMessage.click();
      }
      return;
    }

  }, [
    navigate,
    enableGlobalShortcuts,
    enableChatShortcuts,
    enableNavigationShortcuts,
    setShowKeyboardShortcuts,
    isSubmitting
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);

    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [handleKeyboardShortcut]);

  return {
    showKeyboardShortcuts,
    setShowKeyboardShortcuts
  };
}

// Export shortcut information for help display
export const shortcutCategories = [
  {
    title: 'Global',
    shortcuts: [
      { keys: ['Cmd', '?'], description: 'Show keyboard shortcuts' },
      { keys: ['Cmd', 'K'], description: 'Focus search' },
      { keys: ['Cmd', 'B'], description: 'Toggle sidebar' },
      { keys: ['Cmd', 'N'], description: 'New conversation' },
      { keys: ['Cmd', 'U'], description: 'Upload file' },
    ]
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Cmd', '1'], description: 'Go to conversations' },
      { keys: ['Cmd', '2'], description: 'Go to agents' },
      { keys: ['Cmd', ','], description: 'Open settings' },
    ]
  },
  {
    title: 'Chat',
    shortcuts: [
      { keys: ['Cmd', 'Enter'], description: 'Send message' },
      { keys: ['Escape'], description: 'Stop generation' },
      { keys: ['/'], description: 'Focus message input' },
      { keys: ['Cmd', 'End'], description: 'Scroll to bottom' },
      { keys: ['Cmd', 'Home'], description: 'Scroll to top' },
      { keys: ['Cmd', 'Shift', 'C'], description: 'Copy last response' },
    ]
  }
];

export default useKeyboardShortcuts;