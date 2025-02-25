import { ExecutionGraph, ExecutionMode, ToolExecutionNode } from './EnhancedToolOrchestrator';
import { ITool, ToolOutput } from './ITool';

/**
 * Fluent API for building tool execution graphs
 */
export class GraphBuilder {
  private nodes: ToolExecutionNode[] = [];
  private mode: ExecutionMode = ExecutionMode.SEQUENTIAL;
  private maxConcurrency?: number;

  constructor() {}

  /**
   * Create a new node in the graph
   */
  addNode(nodeConfig: {
    id: string;
    toolName: string;
    input: string | ((context: any) => string);
    priority?: number;
    dependsOn?: string[];
    mode?: ExecutionMode;
    condition?: (results: Map<string, ToolOutput>) => boolean;
    transformOutput?: (output: ToolOutput, context: any) => any;
    retryConfig?: {
      maxRetries: number;
      delayMs: number;
      shouldRetry?: (error: Error, attempt: number) => boolean;
    };
  }): GraphBuilder {
    this.nodes.push({
      id: nodeConfig.id,
      toolName: nodeConfig.toolName,
      input: nodeConfig.input,
      priority: nodeConfig.priority || 0,
      dependsOn: nodeConfig.dependsOn,
      mode: nodeConfig.mode,
      condition: nodeConfig.condition,
      transformOutput: nodeConfig.transformOutput,
      retryConfig: nodeConfig.retryConfig
    });

    return this;
  }

  /**
   * Add a simple tool node with no dependencies
   */
  addTool(id: string, toolName: string, input: string, priority: number = 0): GraphBuilder {
    return this.addNode({
      id,
      toolName,
      input,
      priority
    });
  }

  /**
   * Add a node that depends on the results of other nodes
   */
  addDependentTool(
    id: string,
    toolName: string,
    inputFn: (context: any) => string,
    dependsOn: string[],
    priority: number = 0
  ): GraphBuilder {
    return this.addNode({
      id,
      toolName,
      input: inputFn,
      dependsOn,
      priority
    });
  }

  /**
   * Add a conditional node that only executes if a condition is met
   */
  addConditionalTool(
    id: string,
    toolName: string,
    input: string | ((context: any) => string),
    condition: (results: Map<string, ToolOutput>) => boolean,
    dependsOn?: string[],
    priority: number = 0
  ): GraphBuilder {
    return this.addNode({
      id,
      toolName,
      input,
      dependsOn,
      priority,
      mode: ExecutionMode.CONDITIONAL,
      condition
    });
  }

  /**
   * Add a node with output transformation
   */
  addTransformingTool(
    id: string,
    toolName: string,
    input: string | ((context: any) => string),
    transformOutput: (output: ToolOutput, context: any) => any,
    dependsOn?: string[],
    priority: number = 0
  ): GraphBuilder {
    return this.addNode({
      id,
      toolName,
      input,
      dependsOn,
      priority,
      transformOutput
    });
  }

  /**
   * Add a node with retry capabilities
   */
  addRetryableTool(
    id: string,
    toolName: string,
    input: string | ((context: any) => string),
    retryConfig: {
      maxRetries: number;
      delayMs: number;
      shouldRetry?: (error: Error, attempt: number) => boolean;
    },
    dependsOn?: string[],
    priority: number = 0
  ): GraphBuilder {
    return this.addNode({
      id,
      toolName,
      input,
      dependsOn,
      priority,
      retryConfig
    });
  }

  /**
   * Set execution mode to sequential (default)
   */
  sequential(): GraphBuilder {
    this.mode = ExecutionMode.SEQUENTIAL;
    return this;
  }

  /**
   * Set execution mode to parallel
   */
  parallel(maxConcurrency?: number): GraphBuilder {
    this.mode = ExecutionMode.PARALLEL;
    this.maxConcurrency = maxConcurrency;
    return this;
  }

  /**
   * Add a chain of dependent tools
   */
  addChain(
    chainConfig: {
      prefix: string;
      tools: Array<{
        toolName: string;
        input: string | ((prevResult: any) => string);
        transformOutput?: (output: ToolOutput) => any;
      }>;
    }
  ): GraphBuilder {
    if (chainConfig.tools.length === 0) {
      return this;
    }

    // Add first node
    const firstTool = chainConfig.tools[0];
    const firstNodeId = `${chainConfig.prefix}-0`;
    
    this.addNode({
      id: firstNodeId,
      toolName: firstTool.toolName,
      input: typeof firstTool.input === 'function' 
        ? ((context: any) => (firstTool.input as Function)(null))
        : firstTool.input,
      transformOutput: firstTool.transformOutput
    });

    // Add remaining nodes with dependencies
    for (let i = 1; i < chainConfig.tools.length; i++) {
      const tool = chainConfig.tools[i];
      const nodeId = `${chainConfig.prefix}-${i}`;
      const prevNodeId = `${chainConfig.prefix}-${i-1}`;
      
      this.addNode({
        id: nodeId,
        toolName: tool.toolName,
        input: typeof tool.input === 'function'
          ? ((context: any) => {
              const prevResult = context.getPreviousResult(prevNodeId);
              return (tool.input as Function)(prevResult?.result);
            })
          : tool.input,
        dependsOn: [prevNodeId],
        transformOutput: tool.transformOutput
      });
    }

    return this;
  }

  /**
   * Build and return the final execution graph
   */
  build(): ExecutionGraph {
    if (this.nodes.length === 0) {
      throw new Error('Cannot build an empty execution graph');
    }

    return {
      nodes: [...this.nodes],
      mode: this.mode,
      maxConcurrency: this.maxConcurrency
    };
  }

  /**
   * Create a simple graph for a single tool
   */
  static createSingleToolGraph(
    toolName: string,
    input: string,
    id: string = 'single-tool'
  ): ExecutionGraph {
    return new GraphBuilder()
      .addTool(id, toolName, input)
      .build();
  }

  /**
   * Create a simple sequential chain of tools
   */
  static createSequentialChain(
    chainConfig: {
      tools: Array<{
        toolName: string;
        input: string | ((prevResult: any) => string);
        transformOutput?: (output: ToolOutput) => any;
      }>;
    }
  ): ExecutionGraph {
    return new GraphBuilder()
      .addChain({
        prefix: 'chain',
        tools: chainConfig.tools
      })
      .build();
  }

  /**
   * Create a graph from an array of tools to run in parallel
   */
  static createParallelGraph(
    tools: Array<{
      toolName: string;
      input: string;
      id?: string;
    }>,
    maxConcurrency?: number
  ): ExecutionGraph {
    const builder = new GraphBuilder().parallel(maxConcurrency);
    
    tools.forEach((tool, index) => {
      builder.addTool(
        tool.id || `parallel-${index}`,
        tool.toolName,
        tool.input
      );
    });
    
    return builder.build();
  }
}