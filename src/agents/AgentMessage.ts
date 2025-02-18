// src/agents/AgentMessage.ts

export interface AgentMessage {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    timestamp: number;
  }
  