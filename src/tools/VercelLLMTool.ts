import { OpenAIStream, StreamingTextResponse } from 'ai';
import { ITool, ToolOutput } from './ITool';

export class VercelLLMTool implements ITool {
  name = 'VercelLLMTool';
  description = 'Advanced LLM tool using Vercel AI SDK';
  
  private model: string;
  private temperature: number;

  constructor(model = 'gpt-4o', temperature = 0.7) {
    this.model = model;
    this.temperature = temperature;
  }

  async execute(input: string): Promise<ToolOutput> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: input }],
          temperature: this.temperature,
          stream: true,
        }),
      });

      const stream = OpenAIStream(response);
      return { result: new StreamingTextResponse(stream) };
    } catch (error) {
      return { result: null, error: error.message };
    }
  }
} 