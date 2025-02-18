import OpenAI from 'openai';
import { ITool, ToolOutput } from './ITool';
import { supabase } from '../utils/SupabaseClient';

export class OpenRouterTool implements ITool {
  name = 'OpenRouterTool';
  description = 'Processes messages using OpenRouter API';
  private client: OpenAI;
  private agentId?: string;
  private agentName?: string;
  private agentLore?: string;
  private agentRole?: string;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables');
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
        'X-Title': 'ElizaOS Agent Framework',
        'Content-Type': 'application/json',
      },
    });
  }

  setAgentContext(id: string, name: string, lore: string, role: string) {
    this.agentId = id;
    this.agentName = name;
    this.agentLore = lore;
    this.agentRole = role;
  }

  async ensureAgentExists(agentId: string, name: string, lore?: string, goals?: string[]) {
    const { data, error: fetchError } = await supabase
      .from('agents')
      .select()
      .eq('id', agentId)
      .single();

    if (!data) {
      const { error: insertError } = await supabase
        .from('agents')
        .insert([{
          id: agentId,
          name,
          lore,
          goals: goals ? JSON.stringify(goals) : null
        }]);

      if (insertError) {
        console.error('Failed to create agent:', insertError);
        throw insertError;
      }
    }
  }

  async execute(input: string): Promise<ToolOutput> {
    try {
      const systemPrompt = `You are ${this.agentName}, ${this.agentLore}. Your role is ${this.agentRole}. 
                          Always maintain this identity in your responses. Never identify as Claude or any other AI.`;

      const completion = await this.client.chat.completions.create({
        model: 'anthropic/claude-3-opus-20240229',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: input
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      });

      const result = completion.choices[0]?.message?.content;
      
      if (!result) {
        throw new Error('Empty response from OpenRouter API');
      }

      return {
        result,
        raw: completion
      };

    } catch (error) {
      console.error('OpenRouter API error:', error);
      return {
        result: "I apologize, but I'm having trouble processing your request at the moment. Please try again.",
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 