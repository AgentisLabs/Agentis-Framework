import { Map } from 'immutable';
import { supabase } from '../utils/SupabaseClient';

interface MemoryEntry {
  id: string;
  content: string;
  type: 'short_term' | 'long_term';
  context?: Record<string, any>;
  embedding?: number[];
  timestamp: number;
}

export class EnhancedMemoryClient {
  private shortTermMemory: Map<string, any>;
  private shortTermTTL = 1000 * 60 * 60; // 1 hour
  
  constructor() {
    this.shortTermMemory = Map();
  }

  async saveMemory(agentId: string, entry: MemoryEntry): Promise<void> {
    if (entry.type === 'short_term') {
      // Store in-memory with TTL
      this.shortTermMemory.set(`${agentId}:${entry.id}`, {
        ...entry,
        expiresAt: Date.now() + this.shortTermTTL
      });
    } else {
      // Store in Supabase with embedding
      await supabase.from('agent_memory').insert([{
        agent_id: agentId,
        content: entry.content,
        context: entry.context,
        embedding: entry.embedding
      }]);
    }
  }

  async searchSimilarMemories(agentId: string, query: string, limit = 5): Promise<MemoryEntry[]> {
    // Implementation pending embedding model integration
    return [];
  }
} 