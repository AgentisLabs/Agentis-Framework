import { ITool, ToolOutput } from './ITool';
import { Logger, LogType } from '../logs/Logger';

export enum ExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional'
}

export interface ToolExecutionNode {
  id: string;
  toolName: string;
  input: string | ((context: ExecutionContext) => string);
  priority: number;
  dependsOn?: string[];
  mode?: ExecutionMode;
  condition?: (results: Map<string, ToolOutput>) => boolean;
  transformOutput?: (output: ToolOutput, context: ExecutionContext) => any;
  retryConfig?: {
    maxRetries: number;
    delayMs: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
  };
}

export interface ExecutionContext {
  results: Map<string, ToolOutput>;
  history: Map<string, ToolOutput[]>;
  agentId: string;
  getPreviousResult: (nodeId: string) => ToolOutput | undefined;
  getAllResults: () => Map<string, ToolOutput>;
}

export interface ExecutionGraph {
  nodes: ToolExecutionNode[];
  mode: ExecutionMode;
  maxConcurrency?: number;
}

export class EnhancedToolOrchestrator {
  private tools: Map<string, ITool> = new Map();
  private executionHistory: Map<string, ToolOutput[]> = new Map();
  private executionCache: Map<string, ToolOutput> = new Map();
  private cacheExpiryMs: number = 60000; // 1 minute default

  constructor(options: { 
    defaultTools?: ITool[],
    cacheExpiryMs?: number
  } = {}) {
    if (options.defaultTools) {
      options.defaultTools.forEach(tool => {
        this.registerTool(tool);
      });
    }
    
    if (options.cacheExpiryMs) {
      this.cacheExpiryMs = options.cacheExpiryMs;
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

  private getCacheKey(toolName: string, input: string): string {
    return `${toolName}:${input}`;
  }

  private async executeSingleNode(
    node: ToolExecutionNode, 
    context: ExecutionContext
  ): Promise<ToolOutput> {
    const tool = this.tools.get(node.toolName);
    if (!tool) {
      throw new Error(`Tool ${node.toolName} not found`);
    }

    // Determine input - either static string or function that generates input
    const inputValue = typeof node.input === 'function' 
      ? node.input(context) 
      : node.input;
    
    // Check cache first
    const cacheKey = this.getCacheKey(node.toolName, inputValue);
    if (this.executionCache.has(cacheKey)) {
      await Logger.log(context.agentId, LogType.TOOL_CALL, {
        tool: node.toolName,
        input: inputValue,
        result: "CACHED",
        nodeId: node.id
      });
      
      return this.executionCache.get(cacheKey)!;
    }

    // Execute with retry logic if configured
    let retries = 0;
    const maxRetries = node.retryConfig?.maxRetries || 0;
    
    while (true) {
      try {
        const result = await tool.execute(inputValue);
        
        // Store in history
        if (!this.executionHistory.has(node.id)) {
          this.executionHistory.set(node.id, []);
        }
        this.executionHistory.get(node.id)!.push(result);
        
        // Store in cache
        this.executionCache.set(cacheKey, result);
        setTimeout(() => {
          this.executionCache.delete(cacheKey);
        }, this.cacheExpiryMs);
        
        // Transform output if needed
        const finalResult = node.transformOutput 
          ? { 
              ...result, 
              result: node.transformOutput(result, context) 
            } 
          : result;
        
        // Log the execution
        await Logger.log(context.agentId, LogType.TOOL_CALL, {
          tool: node.toolName,
          input: inputValue,
          result: finalResult,
          nodeId: node.id
        });
        
        return finalResult;
      } catch (error: unknown) {
        const isRetryable = node.retryConfig?.shouldRetry 
          ? node.retryConfig.shouldRetry(error as Error, retries) 
          : retries < maxRetries;
        
        if (retries < maxRetries && isRetryable) {
          retries++;
          await new Promise(resolve => 
            setTimeout(resolve, node.retryConfig?.delayMs || 1000)
          );
          
          await Logger.log(context.agentId, LogType.TOOL_CALL, {
            tool: node.toolName,
            input: inputValue,
            status: 'RETRY',
            attempt: retries,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          await Logger.log(context.agentId, LogType.ERROR, {
            tool: node.toolName,
            nodeId: node.id,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      }
    }
  }

  async executeGraph(graph: ExecutionGraph, agentId: string): Promise<Map<string, ToolOutput>> {
    const results = new Map<string, ToolOutput>();
    const context: ExecutionContext = {
      results,
      history: this.executionHistory,
      agentId,
      getPreviousResult: (nodeId) => results.get(nodeId),
      getAllResults: () => new Map(results)
    };

    if (graph.mode === ExecutionMode.SEQUENTIAL) {
      // Sort by dependencies and priority
      const sorted = this.topologicalSort(graph.nodes);
      
      for (const node of sorted) {
        // Skip if condition fails
        if (node.mode === ExecutionMode.CONDITIONAL && 
            node.condition && !node.condition(results)) {
          continue;
        }
        
        results.set(node.id, await this.executeSingleNode(node, context));
      }
    } else if (graph.mode === ExecutionMode.PARALLEL) {
      // Group by dependency level
      const levels = this.groupByDependencyLevel(graph.nodes);
      
      for (const level of levels) {
        const concurrentLimit = graph.maxConcurrency || Infinity;
        
        // Execute nodes in this level in parallel, respecting concurrency limits
        for (let i = 0; i < level.length; i += concurrentLimit) {
          const batch = level.slice(i, i + concurrentLimit);
          const executableNodes = batch.filter(node => 
            node.mode !== ExecutionMode.CONDITIONAL || 
            !node.condition || 
            node.condition(results)
          );
          
          const nodePromises = executableNodes.map(async node => {
            try {
              const result = await this.executeSingleNode(node, context);
              results.set(node.id, result);
            } catch (error) {
              // Log error but don't fail the entire execution
              await Logger.log(agentId, LogType.ERROR, {
                message: `Node ${node.id} execution failed`,
                error
              });
            }
          });
          
          await Promise.all(nodePromises);
        }
      }
    }
    
    return results;
  }

  // Sort nodes in topological order (dependencies first)
  private topologicalSort(nodes: ToolExecutionNode[]): ToolExecutionNode[] {
    const nodeMap = new Map<string, ToolExecutionNode>();
    nodes.forEach(node => nodeMap.set(node.id, node));
    
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: ToolExecutionNode[] = [];
    
    function visit(nodeId: string) {
      if (temp.has(nodeId)) {
        throw new Error(`Circular dependency detected involving node ${nodeId}`);
      }
      
      if (visited.has(nodeId)) return;
      
      temp.add(nodeId);
      
      const node = nodeMap.get(nodeId);
      if (!node) return;
      
      const deps = node.dependsOn || [];
      for (const dep of deps) {
        if (nodeMap.has(dep)) {
          visit(dep);
        }
      }
      
      temp.delete(nodeId);
      visited.add(nodeId);
      order.push(node);
    }
    
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }
    
    // Sort by priority within same dependency level
    return order.sort((a, b) => {
      const aDeps = new Set(a.dependsOn || []);
      const bDeps = new Set(b.dependsOn || []);
      
      if (aDeps.has(b.id)) return 1;
      if (bDeps.has(a.id)) return -1;
      
      return a.priority - b.priority;
    });
  }

  // Group nodes by dependency level for parallel execution
  private groupByDependencyLevel(nodes: ToolExecutionNode[]): ToolExecutionNode[][] {
    const nodeMap = new Map<string, ToolExecutionNode>();
    nodes.forEach(node => nodeMap.set(node.id, node));
    
    const levels: Map<string, number> = new Map();
    
    // Calculate the level for each node
    function calculateLevel(nodeId: string): number {
      if (levels.has(nodeId)) return levels.get(nodeId)!;
      
      const node = nodeMap.get(nodeId);
      if (!node) return 0;
      
      if (!node.dependsOn || node.dependsOn.length === 0) {
        levels.set(nodeId, 0);
        return 0;
      }
      
      let maxDependencyLevel = -1;
      for (const depId of node.dependsOn) {
        const depLevel = calculateLevel(depId);
        maxDependencyLevel = Math.max(maxDependencyLevel, depLevel);
      }
      
      const level = maxDependencyLevel + 1;
      levels.set(nodeId, level);
      return level;
    }
    
    // Calculate level for all nodes
    for (const node of nodes) {
      calculateLevel(node.id);
    }
    
    // Group by level
    const levelGroups: Map<number, ToolExecutionNode[]> = new Map();
    for (const node of nodes) {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    }
    
    // Sort and return as array of arrays
    const result: ToolExecutionNode[][] = [];
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    
    for (const level of sortedLevels) {
      const nodesInLevel = levelGroups.get(level)!;
      // Within each level, sort by priority
      nodesInLevel.sort((a, b) => a.priority - b.priority);
      result.push(nodesInLevel);
    }
    
    return result;
  }
}