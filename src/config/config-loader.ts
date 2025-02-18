import { readFileSync } from 'fs';
import path from 'path';
import { AgentConfig } from '../agents/types';
import { ToolRegistry } from '../tools/ToolRegistry';

export class ConfigLoader {
  private static toolRegistry: ToolRegistry;

  static initialize(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  static loadAgentConfig(configName: string): AgentConfig {
    const configPath = path.join(process.cwd(), 'src', 'config', 'agents', `${configName}.json`);
    const rawConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    
    return {
      ...rawConfig,
      tools: (rawConfig.defaultTools as string[] || []).map((toolName: string) => 
        this.toolRegistry.getTool(toolName)
      )
    };
  }
} 