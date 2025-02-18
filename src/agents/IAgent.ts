// src/agents/IAgent.ts

import { AgentMessage } from './AgentMessage';
import { Task } from './Task';
import { ITool } from '../tools/ITool';
import { MiddlewareFunction } from '../middleware/AgentMiddleware';
import { VectorMemoryClient } from '../memory/VectorMemoryClient';
import { ToolRegistry } from '../tools/ToolRegistry';

// Define memory types for better type safety
export interface AgentMemory {
  [key: string]: any;
}

export interface IAgent {
  id: string;
  name: string;
  lore: string;
  role: string;
  goals: string[];
  shortTermMemory: AgentMemory;
  longTermMemory: AgentMemory;
  tools: ITool[];

  receiveMessage(message: AgentMessage): Promise<AgentMessage>;
  generateTasks?(goal: string): Promise<Task[]>;
  executeTask(task: Task): Promise<void>;
  sendMessage(message: AgentMessage): Promise<void>;
  initializeMemory(): Promise<void>;
  useMiddleware(middleware: MiddlewareFunction): void;
  getMemoryClient(): VectorMemoryClient;
  getToolRegistry(): ToolRegistry;
}
