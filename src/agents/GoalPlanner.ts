import { IAgent, AgentMemory } from './IAgent';
import { AgentMessage } from './AgentMessage';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { Task } from './Task';
import { MiddlewareFunction } from '../middleware/AgentMiddleware';
import { EnhancedMemoryClient } from '../memory/EnhancedMemoryClient';
import { ToolRegistry } from '../tools/ToolRegistry';
import { ITool } from '../tools/ITool';

export class GoalPlanner implements IAgent {
  public id: string;
  public name: string;
  public lore: string;
  public role: string;
  public goals: string[];
  public shortTermMemory: Record<string, any>;
  public longTermMemory: Record<string, any>;
  public tools: ITool[];
  
  private memoryClient: EnhancedMemoryClient;
  private toolRegistry: ToolRegistry;
  private middlewares: MiddlewareFunction[] = [];

  constructor(
    id: string = 'goal-planner-1',
    name: string = 'GoalPlanner',
    lore: string = 'I am a strategic goal planner that analyzes user requests and determines whether to create new goals or use existing context.',
    role: string = 'Goal Planning Strategist',
    goals: string[] = ['Optimize agent responses', 'Maintain conversation context', 'Create efficient goals'],
    tools: ITool[] = [new OpenRouterTool()]
  ) {
    this.id = id;
    this.name = name;
    this.lore = lore;
    this.role = role;
    this.goals = goals;
    this.tools = tools;
    this.shortTermMemory = {};
    this.longTermMemory = {};
    this.memoryClient = new EnhancedMemoryClient();
    this.toolRegistry = new ToolRegistry({ defaultTools: tools });
  }

  async analyzeRequest(message: string, conversationContext: string[]): Promise<{
    requiresNewGoal: boolean;
    useExistingContext: boolean;
    suggestedGoal?: string;
    contextualResponse?: string;
  }> {
    const tool = this.tools[0];
    
    const planningPrompt = `
      You are a strategic goal planner with access to real-time data and analysis capabilities.
      Current date: ${new Date().toISOString()}
      
      Previous conversation context:
      ${conversationContext.join('\n')}

      New user message: ${message}

      Analyze whether this message:
      1. Requires a new research/analysis goal
      2. Can be answered using existing conversation context
      3. Is a follow-up question to previous discussion

      You have the capability to analyze market data, research information, and provide concrete insights.
      Don't be overly cautious - use your capabilities to provide meaningful analysis.

      Return ONLY a JSON object in this format:
      {
        "requiresNewGoal": boolean,
        "useExistingContext": boolean,
        "suggestedGoal": string | null,
        "reasoning": string,
        "contextualResponse": string | null
      }
    `;

    const response = await tool.execute(planningPrompt);
    return JSON.parse(response.result);
  }

  // Implement required IAgent interface methods
  async receiveMessage(message: AgentMessage): Promise<AgentMessage> {
    return {
      id: `msg-${Date.now()}`,
      sender_id: this.id,
      recipient_id: message.sender_id,
      content: 'Goal planning complete',
      timestamp: Date.now()
    };
  }

  async executeTask(task: Task): Promise<void> {
    // Goal planner doesn't execute tasks directly
    console.log('Task execution requested:', task);
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    console.log('Message sent:', message);
  }

  async initializeMemory(): Promise<void> {
    // Initialize memory if needed
    this.shortTermMemory = {};
    this.longTermMemory = {};
  }

  useMiddleware(middleware: MiddlewareFunction): void {
    this.middlewares.push(middleware);
  }

  getMemoryClient(): EnhancedMemoryClient {
    return this.memoryClient;
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }
} 