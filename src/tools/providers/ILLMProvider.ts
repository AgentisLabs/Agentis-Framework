// src/tools/providers/ILLMProvider.ts

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  raw?: any;
}

export interface ProviderOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  [key: string]: any;
}

export interface ILLMProvider {
  name: string;
  initialize(options: ProviderOptions): Promise<void>;
  generateResponse(messages: LLMMessage[]): Promise<LLMResponse>;
  streamResponse?(messages: LLMMessage[], callback: (chunk: string) => void): Promise<LLMResponse>;
}