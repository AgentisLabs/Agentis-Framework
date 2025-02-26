// src/tools/LLMService.ts

import { ILLMProvider, LLMMessage, LLMResponse, ProviderOptions } from './providers/ILLMProvider';
import { ProviderFactory, ProviderType } from './providers/ProviderFactory';

export interface LLMServiceOptions extends ProviderOptions {
  provider: ProviderType;
}

export class LLMService {
  private provider: ILLMProvider | null = null;
  private options: LLMServiceOptions;
  private initialized: boolean = false;

  constructor(options: LLMServiceOptions) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      this.provider = await ProviderFactory.createProvider(
        this.options.provider, 
        this.options
      );
      this.initialized = true;
    }
  }

  async generateResponse(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.provider!.generateResponse(messages);
  }

  async streamResponse(messages: LLMMessage[], callback: (chunk: string) => void): Promise<LLMResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.provider!.streamResponse) {
      throw new Error(`Provider ${this.options.provider} does not support streaming`);
    }

    return this.provider!.streamResponse(messages, callback);
  }

  getProviderName(): string {
    return this.provider?.name || 'uninitialized';
  }

  updateOptions(options: Partial<LLMServiceOptions>): void {
    // If provider type changes, we need to reinitialize
    const providerChanged = options.provider && options.provider !== this.options.provider;
    
    this.options = { ...this.options, ...options };
    
    if (providerChanged) {
      this.provider = null;
      this.initialized = false; // Will be reinitialized on next call
    }
  }
}