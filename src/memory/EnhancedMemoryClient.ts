import { supabase } from '../utils/SupabaseClient';

export interface MemoryEntry {
  id?: string;
  content: string;
  type: 'short_term' | 'long_term';
  context?: Record<string, any>;
  embedding?: number[];
  timestamp: number;
}

export class EnhancedMemoryClient {
  private shortTermTTL = 1000 * 60 * 60; // 1 hour
  
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
    // Implement semantic search using embeddings
    // This would require integration with an embedding model
    // Return combined results from both short-term and long-term memory
  }
} 