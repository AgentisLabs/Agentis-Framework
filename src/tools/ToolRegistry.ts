import { ITool } from './ITool';

export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();
  private toolChains: Map<string, ITool[]> = new Map();

  constructor(options: { defaultTools?: ITool[] } = {}) {
    if (options.defaultTools) {
      options.defaultTools.forEach(tool => {
        this.registerTool(tool);
      });
    }
  }

  registerTool(tool: ITool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  getTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  registerToolChain(name: string, tools: ITool[]) {
    this.toolChains.set(name, tools);
  }

  async executeToolChain(chainName: string, input: string): Promise<{
    results: any[];
    metadata: {
      toolName: string;
      status: 'success' | 'failed';
      timestamp: number;
    }[];
  }> {
    const chain = this.toolChains.get(chainName);
    if (!chain) throw new Error(`Tool chain ${chainName} not found`);
    
    const results: any[] = [];
    const metadata: {
      toolName: string;
      status: 'success' | 'failed';
      timestamp: number;
    }[] = [];
    
    for (const tool of chain) {
      try {
        const result = await tool.execute(input);
        results.push(result);
        metadata.push({
          toolName: tool.name,
          status: 'success' as const,
          timestamp: Date.now()
        });
      } catch (error) {
        metadata.push({
          toolName: tool.name,
          status: 'failed' as const,
          timestamp: Date.now()
        });
      }
    }
    
    return { results, metadata };
  }
} 