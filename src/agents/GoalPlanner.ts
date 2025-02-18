import { IAgent } from './IAgent';
import { AgentMessage } from './AgentMessage';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { Task } from './Task';
import { MiddlewareFunction } from '../middleware/AgentMiddleware';
import { VectorMemoryClient } from '../memory/VectorMemoryClient';
import { ToolRegistry } from '../tools/ToolRegistry';

export class GoalPlanner implements IAgent {
  public id = 'goal-planner-1';
  public name = 'GoalPlanner';
  public lore = 'I am a strategic goal planner that analyzes user requests and determines whether to create new goals or use existing context.';
  public role = 'Goal Planning Strategist';
  public goals = ['Optimize agent responses', 'Maintain conversation context', 'Create efficient goals'];
  public shortTermMemory: Record<string, any> = {};
  public longTermMemory: Record<string, any> = {};
  public tools = [new OpenRouterTool()];
  
  private memoryClient = new VectorMemoryClient();
  private toolRegistry = new ToolRegistry({ defaultTools: this.tools });
  private middlewares: MiddlewareFunction[] = [];

  async analyzeRequest(message: string, conversationContext: string[]): Promise<{
    requiresNewGoal: boolean;
    useExistingContext: boolean;
    suggestedGoal?: string;
    contextualResponse?: string;
  }> {
    const tool = this.tools[0];
    
    const planningPrompt = `
      Previous conversation context:
      ${conversationContext.join('\n')}

      New user message: ${message}

      Analyze whether this message:
      1. Requires a new research/analysis goal
      2. Can be answered using existing conversation context
      3. Is a follow-up question to previous discussion

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

  getMemoryClient(): VectorMemoryClient {
    return this.memoryClient;
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }
} 