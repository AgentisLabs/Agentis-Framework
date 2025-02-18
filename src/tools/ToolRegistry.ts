import { ITool } from './ITool';

export class ToolRegistry {
  private tools: Map<string, ITool>;

  constructor(options: { defaultTools?: ITool[] } = {}) {
    this.tools = new Map();
    
    if (options.defaultTools) {
      options.defaultTools.forEach(tool => {
        this.registerTool(tool);
      });
    }
  }

  registerTool(tool: ITool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ITool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found in registry`);
    }
    return tool;
  }

  getTools(): ITool[] {
    return Array.from(this.tools.values());
  }
} 