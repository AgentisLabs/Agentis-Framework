import { supabase } from '../utils/SupabaseClient';

export class VectorMemoryClient {
  private dimension: number;

  constructor(dimension: number = 1536) {
    this.dimension = dimension;
  }

  async getMemory(agentId: string): Promise<any[]> {
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

  async saveMemory(agentId: string, content: string, embedding?: number[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('memory_entries')
        .insert([{
          agent_id: agentId,
          content,
          embedding: embedding ? embedding : null,
          type: 'message', // Default memory type
          created_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error("Error saving memory:", error);
        throw error;
      }

      // Also save to messages table for conversation tracking
      const { error: msgError } = await supabase
        .from('messages')
        .insert([{
          id: `msg-${Date.now()}`,
          sender_id: agentId,
          recipient_id: 'system',
          content,
          timestamp: new Date().toISOString()
        }]);

      if (msgError) {
        console.error("Error saving message:", msgError);
      }

    } catch (error) {
      console.error("Error in saveMemory:", error);
      throw error;
    }
  }

  async searchSimilar(
    agentId: string,
    embedding: number[],
    limit: number = 5,
    threshold: number = 0.8
  ): Promise<any[]> {
    const { data, error } = await supabase.rpc('search_memories', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      p_agent_id: agentId
    });

    if (error) throw error;
    return data || [];
  }
} 