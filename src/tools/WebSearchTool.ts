// src/tools/WebSearchTool.ts

import axios from 'axios';
import { ITool, ToolOutput } from './ITool';

export class WebSearchTool implements ITool {
  name = 'WebSearchTool';
  description = 'Searches the web for real-time information using Tavily API';
  private apiKey: string;

  constructor() {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is not set in environment variables');
    }
    this.apiKey = apiKey;
  }

  async execute(input: string): Promise<ToolOutput> {
    try {
      // Extract just the search query, removing any analysis instructions
      const searchQuery = this.extractSearchQuery(input);
      
      const response = await axios.post('https://api.tavily.com/search', {
        query: searchQuery,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
        include_images: false,
        include_raw_content: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        result: response.data.answer || response.data.results?.map((r: any) => r.title + ': ' + r.content).join('\n\n'),
        raw: response.data
      };
    } catch (error) {
      console.error('WebSearchTool error:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Response:', error.response?.data);
      }
      return {
        result: null,
        error: error instanceof Error ? error.message : 'An error occurred during web search'
      };
    }
  }

  private extractSearchQuery(input: string): string {
    // Remove any analysis instructions and keep only the core search query
    const cleanInput = input
      .replace(/Analyze.*?:/g, '')
      .replace(/Based on.*?:/g, '')
      .replace(/Please.*?:/g, '')
      .trim();

    // Limit query length to prevent API errors
    return cleanInput.slice(0, 300);
  }

  // Helper method to clean and format content
  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
}
