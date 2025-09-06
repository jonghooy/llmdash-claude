import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWorkerStreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: () => void;
  batchSize?: number;
  processInterval?: number;
}

export const useWorkerStream = (options: UseWorkerStreamOptions = {}) => {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const accumulatedText = useRef<string>('');

  useEffect(() => {
    // Create worker only if supported
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers not supported, falling back to main thread');
      setIsReady(true);
      return;
    }

    try {
      // Create worker
      workerRef.current = new Worker('/stream-worker.js');

      // Setup message handler
      workerRef.current.onmessage = (e) => {
        const { type, data, remaining } = e.data;

        switch (type) {
          case 'ready':
            setIsReady(true);
            // Configure worker
            if (options.batchSize || options.processInterval) {
              workerRef.current?.postMessage({
                type: 'config',
                data: {
                  batchSize: options.batchSize,
                  processInterval: options.processInterval
                }
              });
            }
            break;

          case 'chunk':
            accumulatedText.current += data;
            options.onChunk?.(data);
            setIsProcessing(remaining > 0);
            
            if (remaining === 0) {
              options.onComplete?.();
            }
            break;

          default:
            console.warn('Unknown worker message type:', type);
        }
      };

      // Error handler
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        setIsReady(false);
      };

    } catch (error) {
      console.error('Failed to create worker:', error);
      setIsReady(true); // Fallback to non-worker mode
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const addChunk = useCallback((chunk: string) => {
    if (workerRef.current && isReady) {
      workerRef.current.postMessage({ type: 'add', data: chunk });
      setIsProcessing(true);
    } else {
      // Fallback for non-worker mode
      accumulatedText.current += chunk;
      options.onChunk?.(chunk);
    }
  }, [isReady, options]);

  const flush = useCallback(() => {
    if (workerRef.current && isReady) {
      workerRef.current.postMessage({ type: 'flush' });
    }
  }, [isReady]);

  const clear = useCallback(() => {
    accumulatedText.current = '';
    if (workerRef.current && isReady) {
      workerRef.current.postMessage({ type: 'clear' });
    }
    setIsProcessing(false);
  }, [isReady]);

  const getText = useCallback(() => accumulatedText.current, []);

  return {
    addChunk,
    flush,
    clear,
    getText,
    isReady,
    isProcessing,
    hasWorker: !!workerRef.current
  };
};