import { ITool } from './ITool';
import { Logger, LogType } from '../logs/Logger';

export interface ToolExecutionPlan {
  toolName: string;
  input: string;
  priority: number;
  dependsOn?: string[];
}

interface ToolError {
  message: string;
  code?: string;
  details?: any;
}

export class ToolOrchestrator {
  private tools: Map<string, ITool> = new Map();
  private executionHistory: Map<string, any> = new Map();

  registerTool(tool: ITool) {
    this.tools.set(tool.name, tool);
  }

  async executePlan(plans: ToolExecutionPlan[], agentId: string): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const pendingPlans = [...plans].sort((a, b) => a.priority - b.priority);

    while (pendingPlans.length > 0) {
      const executable = pendingPlans.filter(plan => 
        !plan.dependsOn || plan.dependsOn.every(dep => results.has(dep))
      );

      if (executable.length === 0) {
        throw new Error('Circular dependency detected in tool execution plan');
      }

      await Promise.all(executable.map(async plan => {
        const tool = this.tools.get(plan.toolName);
        if (!tool) {
          throw new Error(`Tool ${plan.toolName} not found`);
        }

        try {
          const result = await tool.execute(plan.input);
          results.set(plan.toolName, result);
          this.executionHistory.set(plan.toolName, result);
          
          await Logger.log(agentId, LogType.TOOL_CALL, {
            tool: plan.toolName,
            input: plan.input,
            result
          });
        } catch (error: unknown) {
          const toolError: ToolError = {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            details: error
          };

          await Logger.log(agentId, LogType.ERROR, {
            tool: plan.toolName,
            error: toolError
          });
          throw new Error(`Tool execution failed: ${toolError.message}`);
        }
      }));

      executable.forEach(executed => {
        const index = pendingPlans.findIndex(p => p.toolName === executed.toolName);
        pendingPlans.splice(index, 1);
      });
    }

    return results;
  }
} 