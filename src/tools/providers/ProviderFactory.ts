// src/tools/providers/ProviderFactory.ts

import { ILLMProvider, ProviderOptions } from './ILLMProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { GoogleProvider } from './GoogleProvider';

export type ProviderType = 'anthropic' | 'openai' | 'openrouter' | 'google';

export class ProviderFactory {
  private static providers: Record<string, new () => ILLMProvider> = {
    'anthropic': AnthropicProvider,
    'openai': OpenAIProvider,
    'openrouter': OpenRouterProvider,
    'google': GoogleProvider
  };

  static registerProvider(name: string, providerClass: new () => ILLMProvider): void {
    this.providers[name] = providerClass;
  }

  static async createProvider(type: ProviderType, options: ProviderOptions = {}): Promise<ILLMProvider> {
    const ProviderClass = this.providers[type];
    
    if (!ProviderClass) {
      throw new Error(`Provider type '${type}' not supported`);
    }
    
    const provider = new ProviderClass();
    await provider.initialize(options);
    
    return provider;
  }

  static getAvailableProviders(): string[] {
    return Object.keys(this.providers);
  }
}