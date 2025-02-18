// src/tools/WebSearchTool.ts

import { ITool, ToolOutput } from './ITool';
import axios from 'axios';

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export class WebSearchTool implements ITool {
  name = 'WebSearchTool';
  description = 'Searches the web for real-time information using Tavily API';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('TAVILY_API_KEY is not set in environment variables');
    }
  }

  async execute(query: string): Promise<ToolOutput> {
    try {
      console.log('Executing web search for:', query);
      
      const response = await axios.post('https://api.tavily.com/search', {
        query: query,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
        include_images: false,
        include_raw_content: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const results = response.data.results || [];
      
      // Format the results
      const formattedResults = results.map((result: SearchResult) => ({
        title: result.title,
        content: result.content
      }));

      return {
        result: JSON.stringify(formattedResults),
        raw: response.data
      };

    } catch (error) {
      console.error('Tavily API error:', error);
      throw error;
    }
  }

  // Helper method to clean and format content
  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
}
