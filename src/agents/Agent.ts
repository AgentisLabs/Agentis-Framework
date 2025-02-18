// src/agents/Agent.ts

import { IAgent, AgentMemory } from './IAgent';
import { AgentMessage } from './AgentMessage';
import { Task } from './Task';
import { Logger, LogType } from '../logs/Logger';
import { supabase } from '../utils/SupabaseClient';
import { MiddlewareFunction } from '../middleware/AgentMiddleware';
import { VectorMemoryClient } from '../memory/VectorMemoryClient';
import { ToolRegistry } from '../tools/ToolRegistry';
import { ITool } from '../tools/ITool';
import OpenAI from 'openai';
import { AgentConfig } from './types';

interface TaskError {
  message: string;
  code?: string;
  details?: any;
}

export class Agent implements IAgent {
  public id: string;
  public name: string;
  public lore: string;
  public role: string;
  public goals: string[];
  public shortTermMemory: AgentMemory;
  public longTermMemory: AgentMemory;
  public tools: ITool[];
  
  private llmClient: OpenAI;
  private toolRegistry: ToolRegistry;
  private memoryClient: VectorMemoryClient;
  private middlewares: MiddlewareFunction[] = [];
  private taskQueue: Task[] = [];
  private isExecuting: boolean = false;
  private model: AgentConfig['model'];

  constructor(
    id: string,
    name: string,
    lore: string,
    role: string,
    goals: string[],
    tools: ITool[] = [],
    model?: AgentConfig['model']
  ) {
    this.id = id;
    this.name = name;
    this.lore = lore;
    this.role = role;
    this.goals = goals;
    this.shortTermMemory = {};
    this.longTermMemory = {};
    this.tools = tools;
    // Default model configuration if none provided
    this.model = model || {
      provider: 'anthropic',
      name: 'anthropic/claude-3-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 4096
    };

    // Initialize the core LLM with proper error handling
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables');
    }

    this.llmClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
        'X-Title': 'Agentis Framework',
      },
    });

    // Initialize tools and memory
    this.toolRegistry = new ToolRegistry({ defaultTools: tools });
    this.memoryClient = new VectorMemoryClient();
  }

  async initializeMemory(): Promise<void> {
    // First ensure agent exists in database
    const { error } = await supabase
      .from('agents')
      .upsert({
        id: this.id,
        name: this.name,
        lore: this.lore,
        role: this.role,
        goals: this.goals
      });

    if (error) {
      throw new Error(`Failed to initialize agent in database: ${error.message}`);
    }

    // Load any existing memories from long-term storage
    const existingMemories = await this.memoryClient.getMemory(this.id);
    
    // Convert memories to the expected format
    this.longTermMemory = existingMemories.reduce((acc: AgentMemory, memory: { id: string; content: string }) => {
      acc[memory.id] = memory.content;
      return acc;
    }, {} as AgentMemory);
  }

  useMiddleware(middleware: MiddlewareFunction): void {
    this.middlewares.push(middleware);
  }

  getMemoryClient(): VectorMemoryClient {
    return this.memoryClient;
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  async receiveMessage(message: AgentMessage): Promise<AgentMessage> {
    await Logger.log(this.id, LogType.MESSAGE, { event: 'receiveMessage', message });
    console.log(`[${this.name}] Received message:`, message.content);

    try {
      // First, determine if we need to use any tools
      const toolPlanningPrompt = `You are ${this.name}, ${this.lore}. Your role is ${this.role}.
        You have access to these tools: ${this.tools.map(t => `${t.name}: ${t.description}`).join('\n')}
        
        User message: ${message.content}
        
        Based on this message, should you use any tools to help answer? Respond ONLY with a JSON object in this format:
        {
          "useTool": boolean,
          "toolName": string | null,
          "reason": string
        }
        
        IMPORTANT: Respond ONLY with the JSON object, no other text.`;

      const planningResponse = await this.llmClient.chat.completions.create({
        model: this.model?.name || 'anthropic/claude-3-sonnet-20240229',
        temperature: this.model?.temperature || 0.7,
        max_tokens: this.model?.maxTokens || 4096,
        messages: [
          {
            role: 'system',
            content: 'You are a JSON formatting assistant. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: toolPlanningPrompt
          }
        ]
      });

      let plan;
      try {
        plan = JSON.parse(planningResponse.choices[0]?.message?.content?.trim() || '{}');
      } catch (e) {
        console.error('Failed to parse planning response:', planningResponse.choices[0]?.message?.content);
        plan = { useTool: true, toolName: 'WebSearchTool', reason: 'Fallback to web search due to parsing error' };
      }

      let toolOutput = '';
      if (plan.useTool) {
        const tool = this.tools.find(t => t.name === plan.toolName);
        if (tool) {
          const result = await tool.execute(message.content);
          toolOutput = result.result;
        }
      }

      // Generate final response using tool output if available
      const finalPrompt = `You are ${this.name}, ${this.lore}. Your role is ${this.role}.
        ${toolOutput ? `Here is relevant information I found: ${toolOutput}` : ''}
        
        Please respond to: ${message.content}`;

      const completion = await this.llmClient.chat.completions.create({
        model: 'anthropic/claude-3-opus-20240229',
        messages: [{ role: 'user', content: finalPrompt }]
      });

      const responseContent = completion.choices[0]?.message?.content || 'I apologize, I am unable to respond at the moment.';

      const responseMessage: AgentMessage = {
        id: `msg-${Date.now()}`,
        sender_id: this.id,
        recipient_id: message.sender_id,
        content: responseContent,
        timestamp: Date.now()
      };

      await this.memoryClient.saveMemory(
        this.id,
        `User: ${message.content}\nAgent: ${responseContent}`
      );

      return responseMessage;

    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  async planAndExecute(goal: string): Promise<void> {
    // Generate tasks for the goal
    const tasks = await this.generateTasks(goal);
    this.taskQueue.push(...tasks);
    
    // Start execution if not already running
    if (!this.isExecuting) {
      await this.executeTaskQueue();
    }
  }

  private async executeTaskQueue(): Promise<void> {
    this.isExecuting = true;

    while (this.taskQueue.length > 0) {
      const currentTask = this.taskQueue[0];
      
      try {
        // 1. Plan tool calls needed for this task
        const toolPlan = await this.planToolCalls(currentTask);
        
        // 2. Execute each tool call in sequence
        for (const toolCall of toolPlan) {
          const tool = this.tools.find(t => t.name === toolCall.tool);
          if (!tool) {
            throw new Error(`Tool ${toolCall.tool} not found`);
          }
          
          const result = await tool.execute(toolCall.input);
          
          // Store result in short-term memory
          this.shortTermMemory[`${currentTask.id}-${toolCall.tool}`] = result;
        }

        // 3. Update task status
        currentTask.status = 'completed';
        currentTask.updated_at = Date.now();
        
        // 4. Log completion
        await Logger.log(this.id, LogType.STATUS_UPDATE, { 
          event: 'task-complete',
          task: currentTask 
        });

      } catch (error: unknown) {
        const taskError: TaskError = {
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          details: error
        };

        currentTask.status = 'failed';
        currentTask.error = taskError.message;
        
        await Logger.log(this.id, LogType.ERROR, { 
          event: 'task-failed',
          task: currentTask,
          error: taskError
        });
      }

      // Remove task from queue
      this.taskQueue.shift();
    }

    this.isExecuting = false;
  }

  private async planToolCalls(task: Task): Promise<Array<{tool: string, input: string}>> {
    // Use LLM to plan necessary tool calls
    const llmTool = this.tools.find(tool => tool.name === 'OpenRouterTool');
    
    const planningPrompt = `
      Task: ${task.description}
      Available tools: ${this.tools.map(t => `${t.name}: ${t.description}`).join('\n')}
      
      Plan the necessary tool calls to complete this task. Return as JSON array:
      [{ "tool": "toolName", "input": "tool input" }]
    `;

    const response = await llmTool?.execute(planningPrompt);
    return JSON.parse(response?.result);
  }

  async generateTasks(goal: string): Promise<Task[]> {
    const llmTool = this.tools.find(tool => tool.name === 'OpenRouterTool');
    
    const taskPlanningPrompt = `
      Goal: ${goal}
      Current role: ${this.role}
      
      Break this goal down into sequential tasks. Return as JSON array:
      [{ "description": "task description", "priority": 1-5 }]
    `;

    const response = await llmTool?.execute(taskPlanningPrompt);
    const taskPlans = JSON.parse(response?.result);

    return taskPlans.map((plan: any) => ({
      id: `task-${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: plan.description,
      priority: plan.priority,
      status: 'pending',
      assigned_agent_id: this.id,
      created_at: Date.now(),
      updated_at: Date.now()
    }));
  }

  async executeTask(task: Task): Promise<void> {
    // Log task execution start
    await Logger.log(this.id, LogType.STATUS_UPDATE, { event: 'executeTask-start', task });
    console.log(`[${this.name}] Executing task:`, task.description);

    // Example: Use the first available tool to execute the task
    if (this.tools.length > 0) {
      const tool = this.tools[0];
      const result = await tool.execute(task.description);
      await Logger.log(this.id, LogType.TOOL_CALL, { event: 'executeTask', tool: tool.name, result });
      console.log(`[${this.name}] Tool call result:`, result);
    }
    // Update task status to completed
    task.status = 'completed';
    task.updated_at = Date.now();
    await Logger.log(this.id, LogType.STATUS_UPDATE, { event: 'executeTask-complete', task });
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    await Logger.log(this.id, LogType.MESSAGE, { event: 'sendMessage', message });
    
    // Store in messages table
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{
        id: message.id,
        sender_id: message.sender_id,
        recipient_id: message.recipient_id,
        content: message.content,
        timestamp: message.timestamp
      }]);

    if (messageError) {
      console.error("Error storing message:", messageError);
      throw messageError;
    }

    // Also store in memory for context
    await this.memoryClient.saveMemory(
      this.id,
      `${message.sender_id}: ${message.content}`
    );
  }

  private async updateMemory(key: string, value: any, type: 'short' | 'long' = 'short'): Promise<void> {
    if (type === 'short') {
      this.shortTermMemory[key] = value;
    } else {
      this.longTermMemory[key] = value;
      await this.memoryClient.saveMemory(this.id, value);
    }
  }
}
