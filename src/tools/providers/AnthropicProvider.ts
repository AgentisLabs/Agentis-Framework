// src/tools/providers/AnthropicProvider.ts

import Anthropic from '@anthropic-ai/sdk';
import { ILLMProvider, LLMMessage, LLMResponse, ProviderOptions } from './ILLMProvider';

export class AnthropicProvider implements ILLMProvider {
  name = 'anthropic';
  private client: Anthropic | null = null;
  private options: ProviderOptions = {
    model: 'claude-3-7-sonnet-20250219',
    temperature: 0.7,
    maxTokens: 64000
  };

  async initialize(options: ProviderOptions): Promise<void> {
    this.options = { ...this.options, ...options };
    
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not provided and ANTHROPIC_API_KEY environment variable not set');
    }
    
    this.client = new Anthropic({ apiKey });
  }

  async generateResponse(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized');
    }

    try {
      // Extract system message if present
      const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
      
      // Filter to just user and assistant messages for Anthropic API
      const anthropicMessages = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

      const response = await this.client.messages.create({
        model: this.options.model as string,
        max_tokens: this.options.maxTokens || 4096,
        temperature: this.options.temperature,
        system: systemMessage,
        messages: anthropicMessages
      });

      return {
        content: response.content[0].type === 'text' 
          ? response.content[0].text 
          : 'No text response received',
        raw: response
      };
    } catch (error) {
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamResponse(messages: LLMMessage[], callback: (chunk: string) => void): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized');
    }

    try {
      // Extract system message if present
      const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
      
      // Filter to just user and assistant messages for Anthropic API
      const anthropicMessages = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

      const stream = await this.client.messages.create({
        model: this.options.model as string,
        max_tokens: this.options.maxTokens || 4096, 
        temperature: this.options.temperature,
        system: systemMessage,
        messages: anthropicMessages,
        stream: true
      });

      let fullContent = '';

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && 
            chunk.delta.type === 'text_delta' && 
            chunk.delta.text) {
          fullContent += chunk.delta.text;
          callback(chunk.delta.text);
        }
      }

      return {
        content: fullContent,
        raw: null // We don't have the full raw response in streaming mode
      };
    } catch (error) {
      throw new Error(`Anthropic streaming API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}