import { IAgent } from '../agents/IAgent';
import { ToolOrchestrator } from '../tools/ToolOrchestrator';
import { VectorMemoryClient } from '../memory/VectorMemoryClient';
import { EventEmitter } from 'events';
import { supabase } from '../utils/SupabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AgentMessage } from '../agents/AgentMessage';

export class AgentRuntime extends EventEmitter {
  private agents: Map<string, IAgent> = new Map();
  private toolOrchestrator: ToolOrchestrator;
  private memoryClient: VectorMemoryClient;
  private isRunning: boolean = false;
  private messageChannel?: RealtimeChannel;

  constructor() {
    super();
    this.toolOrchestrator = new ToolOrchestrator();
    this.memoryClient = new VectorMemoryClient();
  }

  registerAgent(agent: IAgent) {
    this.agents.set(agent.id, agent);
    agent.tools.forEach(tool => this.toolOrchestrator.registerTool(tool));
  }

  async start() {
    this.isRunning = true;
    this.emit('runtime:started');

    // Initialize all agents
    for (const agent of this.agents.values()) {
      await agent.initializeMemory();
    }

    // Start monitoring for inter-agent messages
    await this.monitorAgentMessages();
  }

  private async monitorAgentMessages() {
    this.messageChannel = supabase
      .channel('agent-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const messageData = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            content: string;
            timestamp: number;
          };

          const message: AgentMessage = {
            id: messageData.id,
            sender_id: messageData.sender_id,
            recipient_id: messageData.recipient_id,
            content: messageData.content,
            timestamp: messageData.timestamp
          };

          const targetAgent = this.agents.get(message.recipient_id);
          if (targetAgent) {
            await targetAgent.receiveMessage(message);
          }
        }
      )
      .subscribe();
  }

  async stop() {
    this.isRunning = false;
    if (this.messageChannel) {
      await this.messageChannel.unsubscribe();
    }
    this.emit('runtime:stopped');
  }
} 