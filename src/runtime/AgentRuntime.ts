import { IAgent } from '../agents/IAgent';
import { ToolOrchestrator } from '../tools/ToolOrchestrator';
import { VectorMemoryClient } from '../memory/VectorMemoryClient';
import { EventEmitter } from 'events';
import { supabase } from '../utils/SupabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AgentMessage } from '../agents/AgentMessage';
import { GoalPlanner } from '../agents/GoalPlanner';
import { Logger, LogType } from '../logs/Logger';

export class AgentRuntime extends EventEmitter {
  private agents: Map<string, IAgent> = new Map();
  private toolOrchestrator: ToolOrchestrator;
  private memoryClient: VectorMemoryClient;
  private isRunning: boolean = false;
  private messageChannel?: RealtimeChannel;
  private goalPlanner: GoalPlanner;
  private conversationHistory: Map<string, string[]> = new Map();

  constructor() {
    super();
    this.goalPlanner = new GoalPlanner();
    this.toolOrchestrator = new ToolOrchestrator();
    this.memoryClient = new VectorMemoryClient();
  }

  registerAgent(agent: IAgent) {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string): IAgent | undefined {
    return this.agents.get(id);
  }

  async start() {
    this.isRunning = true;
    this.emit('runtime:started');

    // Initialize all agents
    for (const agent of this.agents.values()) {
      await agent.initializeMemory();
    }
  }

  async handleUserMessage(message: AgentMessage): Promise<AgentMessage> {
    // Get or initialize conversation history
    const conversationId = `conv-${message.sender_id}`;
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    const history = this.conversationHistory.get(conversationId)!;

    try {
      // Analyze the request with GoalPlanner
      const analysis = await this.goalPlanner.analyzeRequest(
        message.content,
        history
      );

      await Logger.log('runtime', LogType.STATUS_UPDATE, {
        event: 'goal_analysis',
        analysis
      });

      let response: AgentMessage;

      if (analysis.requiresNewGoal) {
        // Route to the appropriate agent for new goal
        const targetAgent = this.selectAgentForMessage(message);
        if (!targetAgent) {
          throw new Error('No suitable agent found for the message');
        }
        response = await targetAgent.receiveMessage(message);
      } else {
        // Use existing context for follow-up
        response = {
          id: `msg-${Date.now()}`,
          sender_id: message.recipient_id,
          recipient_id: message.sender_id,
          content: analysis.contextualResponse || 'I cannot provide a response at this time.',
          timestamp: Date.now()
        };
      }

      // Update conversation history
      history.push(`User: ${message.content}`);
      history.push(`Agent: ${response.content}`);
      this.conversationHistory.set(conversationId, history);

      return response;
    } catch (error) {
      console.error('Error handling message:', error);
      return {
        id: `error-${Date.now()}`,
        sender_id: 'runtime',
        recipient_id: message.sender_id,
        content: 'I apologize, but I encountered an error processing your request.',
        timestamp: Date.now()
      };
    }
  }

  private selectAgentForMessage(message: AgentMessage): IAgent | undefined {
    // For now, return the first available agent
    // TODO: Implement more sophisticated agent selection logic
    return Array.from(this.agents.values())[0];
  }

  async stop() {
    this.isRunning = false;
    this.messageChannel?.unsubscribe();
    this.emit('runtime:stopped');
  }
} 