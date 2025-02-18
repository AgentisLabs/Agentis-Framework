// src/memory/MemoryClient.ts

import { supabase } from '../utils/SupabaseClient';

export class MemoryClient {
  static async saveMemory(agentId: string, content: string, embedding?: number[]): Promise<void> {
    const { error } = await supabase
      .from('agent_memory')
      .insert([{ agent_id: agentId, content, embedding }]);
    if (error) {
      console.error("Error saving memory:", error);
    }
  }

  static async getMemory(agentId: string): Promise<any[]> {
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

  static async searchSimilarMemories(
    agentId: string, 
    query: string, 
    embedding: number[],
    limit = 5
  ): Promise<any[]> {
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: 0.8,
      match_count: limit,
      p_agent_id: agentId
    });

    if (error) {
      console.error("Error searching memories:", error);
      return [];
    }
    return data || [];
  }
}
