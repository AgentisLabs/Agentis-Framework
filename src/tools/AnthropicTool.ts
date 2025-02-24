import { ITool, ToolOutput } from './ITool';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicTool implements ITool {
  name = 'AnthropicTool';
  description = 'Direct access to Claude 3.7 for advanced analysis';
  private client: Anthropic;

  constructor() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    this.client = new Anthropic({
      apiKey: anthropicKey
    });
  }

  async execute(input: string): Promise<ToolOutput> {
    try {
      // Check if this is a planning request
      if (input.includes('Create a focused research plan')) {
        const response = await this.client.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 4096,
          messages: [{ 
            role: 'user', 
            content: `${input}\n\nProvide a direct response with the research plan, no JSON formatting needed. Focus on:
            1. What the Market Researcher should investigate
            2. What the Technical Analyst should analyze
            3. Specific aspects to focus on for each team member`
          }]
        });

        return {
          result: response.content[0].type === 'text' 
            ? response.content[0].text 
            : 'No text response received',
          raw: response
        };
      }

      // Regular analysis request
      const response = await this.client.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 4096,
        messages: [{ role: 'user', content: input }]
      });

      return {
        result: response.content[0].type === 'text' 
          ? response.content[0].text 
          : 'No text response received',
        raw: response
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 