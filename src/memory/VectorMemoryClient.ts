import { supabase } from '../utils/SupabaseClient';

export class VectorMemoryClient {
  private dimension: number;

  constructor(dimension: number = 1536) {
    this.dimension = dimension;
  }

  async getMemory(agentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('agent_id', agentId);
    
    if (error) {
      console.error("Error fetching memory:", error);
      return [];
    }
    return data || [];
  }

  async saveMemory(agentId: string, content: string, embedding?: number[]): Promise<void> {
    if (embedding && embedding.length !== this.dimension) {
      throw new Error(`Embedding must be of dimension ${this.dimension}`);
    }

    const { error } = await supabase
      .from('agent_memory')
      .insert([{ agent_id: agentId, content, embedding }]);
    
    if (error) {
      console.error("Error saving memory:", error);
    }
  }

  async searchSimilar(
    agentId: string,
    embedding: number[],
    limit: number = 5,
    threshold: number = 0.8
  ): Promise<any[]> {
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      p_agent_id: agentId
    });

    if (error) throw error;
    return data || [];
  }
} 