import { memo } from 'react';
import { useRecoilState } from 'recoil';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import { shortcutCategories } from '~/hooks/useKeyboardShortcuts';
import { cn } from '~/utils';
import store from '~/store';

interface KeyboardShortcutsModalProps {
  className?: string;
}

function KeyboardShortcutsModal({ className = '' }: KeyboardShortcutsModalProps) {
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useRecoilState(store.showKeyboardShortcuts);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const formatKey = (key: string) => {
    if (key === 'Cmd' && !isMac) return 'Ctrl';
    if (key === 'Cmd' && isMac) return '⌘';
    if (key === 'Shift') return '⇧';
    if (key === 'Alt') return '⌥';
    if (key === 'Enter') return '↵';
    if (key === 'Escape') return 'Esc';
    if (key === 'End') return 'End';
    if (key === 'Home') return 'Home';
    return key;
  };

  if (!showKeyboardShortcuts) return null;

  return (
    <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
      <DialogContent className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-black/50 backdrop-blur-sm",
        className
      )}>
        <div className="bg-surface-primary border border-border-medium rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b border-border-light">
            <DialogTitle className="text-xl font-semibold text-text-primary">
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription className="text-text-secondary mt-1">
              Use these shortcuts to navigate faster and boost your productivity
            </DialogDescription>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid gap-6">
              {shortcutCategories.map((category) => (
                <div key={category.title} className="space-y-3">
                  <h3 className="text-lg font-medium text-text-primary border-b border-border-light pb-2">
                    {category.title}
                  </h3>

                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-surface-hover transition-colors"
                      >
                        <span className="text-text-secondary">
                          {shortcut.description}
                        </span>

                        <div className="flex items-center space-x-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span
                              key={keyIndex}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-surface-secondary border border-border-medium rounded shadow-sm"
                            >
                              {formatKey(key)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pro Tips */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-text-primary mb-2">💡 Pro Tips</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Most shortcuts work globally, even when not focused on input fields</li>
                <li>• Use <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-xs">Tab</kbd> to navigate between focusable elements</li>
                <li>• Press <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-xs">?</kbd> again to close this modal</li>
                <li>• Shortcuts are designed to work with screen readers</li>
              </ul>
            </div>
          </div>

          <div className="p-4 border-t border-border-light bg-surface-secondary/30">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Save to localStorage that user has seen shortcuts
                  localStorage.setItem('keyboardShortcutsSeen', 'true');
                  setShowKeyboardShortcuts(false);
                }}
                className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(KeyboardShortcutsModal);