import { supabase } from '../utils/SupabaseClient';
import OpenAI from 'openai';

export type MemoryType = 'message' | 'observation' | 'task_result' | 'research';

interface MemoryEntry {
  content: string;
  type: MemoryType;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface MemoryResult {
  id: number;
  agent_id: string;
  content: string;
  type: string;
  metadata: Record<string, any>;
  embedding: number[];
  created_at: string;
}

export class EnhancedMemoryClient {
  private llmClient: OpenAI;
  private dimension: number;

  constructor(dimension: number = 1536) {
    this.dimension = dimension;
    this.llmClient = new OpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async getMemory(agentId: string): Promise<MemoryResult[]> {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching memory:", error);
      return [];
    }
    return data || [];
  }

  async searchSimilar(
    agentId: string,
    embedding: number[],
    limit: number = 5,
    threshold: number = 0.8
  ): Promise<MemoryResult[]> {
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      p_agent_id: agentId
    });

    if (error) throw error;
    return data || [];
  }

  private async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.llmClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: this.dimension
      });

      if (!response.data?.[0]?.embedding) {
        console.warn('Embedding API failed, using fallback vector');
        return new Array(this.dimension).fill(0).map(() => Math.random());
      }

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      return new Array(this.dimension).fill(0).map(() => Math.random());
    }
  }

  async saveMemory(
    agentId: string,
    input: string | MemoryEntry
  ): Promise<void> {
    try {
      let entry: MemoryEntry;
      
      if (typeof input === 'string') {
        entry = {
          content: input,
          type: 'message',
          metadata: {
            timestamp: Date.now()
          }
        };
      } else {
        entry = input;
      }

      const embedding = entry.embedding || await this.createEmbedding(entry.content);

      // Save to memory_entries
      const { error } = await supabase
        .from('memory_entries')
        .insert([{
          agent_id: agentId,
          content: entry.content,
          type: entry.type,
          metadata: entry.metadata,
          embedding,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error("Error inserting into memory_entries:", error);
        throw error;
      }

      // Also save to messages table if it's a message
      if (entry.type === 'message') {
        const { error: msgError } = await supabase
          .from('messages')
          .insert([{
            id: `msg-${Date.now()}`,
            sender_id: agentId,
            recipient_id: entry.metadata?.recipient_id || 'system',
            content: entry.content,
            timestamp: new Date().toISOString()
          }]);

        if (msgError) {
          console.error("Error saving message:", msgError);
        }
      }

      // Log if it's a task result or observation
      if (entry.type === 'task_result' || entry.type === 'observation') {
        const { error: logError } = await supabase
          .from('logs')
          .insert([{
            agent_id: agentId,
            log_type: entry.type,
            details: {
              content: entry.content,
              ...entry.metadata
            },
            created_at: new Date().toISOString()
          }]);

        if (logError) {
          console.error("Error saving log:", logError);
        }
      }

    } catch (error) {
      console.error("Error saving memory:", error);
      throw error;
    }
  }

  async searchMemories(
    agentId: string,
    query: string,
    options: {
      type?: MemoryType;
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<MemoryResult[]> {
    const {
      limit = 5,
      threshold = 0.8,
      type
    } = options;

    try {
      const queryEmbedding = await this.createEmbedding(query);
      const { data, error } = await supabase.rpc('search_memories', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        p_agent_id: agentId,
        p_memory_type: type
      });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error("Error searching memories:", error);
      return [];
    }
  }
} 