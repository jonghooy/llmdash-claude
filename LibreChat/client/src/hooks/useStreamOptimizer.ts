import { useRef, useCallback, useEffect } from 'react';

interface StreamOptimizerOptions {
  debounceMs?: number;
  batchSize?: number;
  smoothing?: boolean;
  onUpdate?: (text: string) => void;
}

class StreamProcessor {
  private buffer: string[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private animationFrame: number | null = null;
  private currentText: string = '';
  private targetText: string = '';
  private lastUpdateTime: number = 0;
  private options: StreamOptimizerOptions;
  private updateCallback?: (text: string) => void;

  constructor(options: StreamOptimizerOptions = {}) {
    this.options = {
      debounceMs: options.debounceMs || 16, // ~60fps
      batchSize: options.batchSize || 5,
      smoothing: options.smoothing !== false,
      ...options
    };
    this.updateCallback = options.onUpdate;
  }

  addChunk(chunk: string) {
    this.buffer.push(chunk);
    this.scheduleUpdate();
  }

  private scheduleUpdate() {
    // Cancel existing timers
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Use requestAnimationFrame for smoother updates
    if (this.options.smoothing && !this.animationFrame) {
      this.animationFrame = requestAnimationFrame(() => {
        this.processBuffer();
        this.animationFrame = null;
      });
    } else {
      // Fallback to setTimeout
      this.debounceTimer = setTimeout(() => {
        this.processBuffer();
      }, this.options.debounceMs);
    }
  }

  private processBuffer() {
    if (this.buffer.length === 0) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    // Process chunks in batches for better performance
    const chunksToProcess = Math.min(
      this.buffer.length,
      this.options.batchSize || this.buffer.length
    );

    const processed = this.buffer.splice(0, chunksToProcess).join('');
    this.targetText += processed;

    // Smooth text updates
    if (this.options.smoothing && timeSinceLastUpdate < 100) {
      // Interpolate for very smooth updates
      this.smoothUpdate();
    } else {
      // Direct update for larger gaps
      this.currentText = this.targetText;
      this.updateCallback?.(this.currentText);
    }

    this.lastUpdateTime = now;

    // Continue processing if there's more in the buffer
    if (this.buffer.length > 0) {
      this.scheduleUpdate();
    }
  }

  private smoothUpdate() {
    const step = () => {
      const diff = this.targetText.length - this.currentText.length;
      if (diff > 0) {
        // Add characters progressively
        const charsToAdd = Math.ceil(diff / 3); // Smooth over 3 frames
        this.currentText = this.targetText.slice(0, this.currentText.length + charsToAdd);
        this.updateCallback?.(this.currentText);

        if (this.currentText.length < this.targetText.length) {
          requestAnimationFrame(step);
        }
      }
    };
    requestAnimationFrame(step);
  }

  reset() {
    this.buffer = [];
    this.currentText = '';
    this.targetText = '';
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  flush() {
    if (this.buffer.length > 0) {
      const allChunks = this.buffer.splice(0);
      this.targetText += allChunks.join('');
      this.currentText = this.targetText;
      this.updateCallback?.(this.currentText);
    }
  }
}

export const useStreamOptimizer = (options: StreamOptimizerOptions = {}) => {
  const processorRef = useRef<StreamProcessor | null>(null);
  const textRef = useRef<string>('');

  useEffect(() => {
    processorRef.current = new StreamProcessor({
      ...options,
      onUpdate: (text) => {
        textRef.current = text;
        options.onUpdate?.(text);
      }
    });

    return () => {
      processorRef.current?.reset();
    };
  }, []);

  const addChunk = useCallback((chunk: string) => {
    processorRef.current?.addChunk(chunk);
  }, []);

  const reset = useCallback(() => {
    processorRef.current?.reset();
    textRef.current = '';
  }, []);

  const flush = useCallback(() => {
    processorRef.current?.flush();
  }, []);

  const getText = useCallback(() => textRef.current, []);

  return {
    addChunk,
    reset,
    flush,
    getText,
    currentText: textRef.current
  };
};