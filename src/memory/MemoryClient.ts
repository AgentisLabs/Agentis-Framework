// src/memory/MemoryClient.ts

import { supabase } from '../utils/SupabaseClient';

export class MemoryClient {
  static async saveMemory(agentId: string, content: string, embedding?: number[]): Promise<void> {
    const { error } = await supabase
      .from('memory_entries')
      .insert([{ 
        agent_id: agentId, 
        content, 
        embedding,
        type: 'message', // Default memory type
        created_at: new Date().toISOString()
      }]);
    if (error) {
      console.error("Error saving memory:", error);
    }
  }

  static async getMemory(agentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('memory_entries')
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
    try {
      const { data, error } = await supabase.rpc('search_memories', {
        query_embedding: embedding,
        match_threshold: 0.8,
        match_count: limit,
        p_agent_id: agentId
      });

      if (error) {
        console.error("Error searching memories:", error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error("Exception in searchSimilarMemories:", error);
      return [];
    }
  }
}
