// src/tools/providers/OpenAIProvider.ts

import OpenAI from 'openai';
import { ILLMProvider, LLMMessage, LLMResponse, ProviderOptions } from './ILLMProvider';

export class OpenAIProvider implements ILLMProvider {
  name = 'openai';
  private client: OpenAI | null = null;
  private options: ProviderOptions = {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4096
  };

  async initialize(options: ProviderOptions): Promise<void> {
    this.options = { ...this.options, ...options };
    
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not provided and OPENAI_API_KEY environment variable not set');
    }
    
    this.client = new OpenAI({ apiKey });
  }

  async generateResponse(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.options.model as string,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
        messages: messages
      });

      return {
        content: response.choices[0]?.message?.content || 'No response generated',
        raw: response
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamResponse(messages: LLMMessage[], callback: (chunk: string) => void): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: this.options.model as string,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
        messages: messages,
        stream: true
      });

      let fullContent = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          callback(content);
        }
      }

      return {
        content: fullContent,
        raw: null // We don't have the full raw response in streaming mode
      };
    } catch (error) {
      throw new Error(`OpenAI streaming API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}