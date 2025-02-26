// src/tools/providers/OpenRouterProvider.ts

import OpenAI from 'openai';
import { ILLMProvider, LLMMessage, LLMResponse, ProviderOptions } from './ILLMProvider';

export class OpenRouterProvider implements ILLMProvider {
  name = 'openrouter';
  private client: OpenAI | null = null;
  private options: ProviderOptions = {
    model: 'anthropic/claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 4096
  };

  async initialize(options: ProviderOptions): Promise<void> {
    this.options = { ...this.options, ...options };
    
    const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not provided and OPENROUTER_API_KEY environment variable not set');
    }
    
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
        'X-Title': 'Agentis Framework',
      },
    });
  }

  async generateResponse(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('OpenRouter client not initialized');
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
      throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamResponse(messages: LLMMessage[], callback: (chunk: string) => void): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('OpenRouter client not initialized');
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
        raw: null
      };
    } catch (error) {
      throw new Error(`OpenRouter streaming API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}