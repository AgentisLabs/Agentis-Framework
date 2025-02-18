export interface MemoryEntry {
  id: string;
  content: string;
  type: 'short_term' | 'long_term';
  context?: Record<string, any>;
  embedding?: number[];
  timestamp: number;
} 