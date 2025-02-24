// src/agents/AgentMessage.ts

export interface AgentMessage {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    timestamp: number;
    metadata?: {
      intent?: 'query' | 'response' | 'clarification' | 'update';
      confidence?: number;
      sources?: string[];
      toolsUsed?: string[];
      context?: string;
      domain?: string;
    };
    threadId?: string;
    parentMessageId?: string;
  }
  