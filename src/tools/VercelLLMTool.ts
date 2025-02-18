import { ITool, ToolOutput } from './ITool';

// Define types for OpenAI API response
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  created: number;
  id: string;
  model: string;
  object: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class VercelLLMTool implements ITool {
  name = 'VercelLLMTool';
  description = 'Advanced LLM tool using OpenAI API';
  
  private model: string;
  private temperature: number;

  constructor(model = 'gpt-4', temperature = 0.7) {
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
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as OpenAIResponse;
      
      return { 
        result: data.choices[0]?.message?.content || '',
        raw: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        result: null, 
        error: errorMessage
      };
    }
  }
} 