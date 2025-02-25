// src/agents/index.ts
import { AgentConfig as InternalAgentConfig } from './types';

export * from './Agent';
export * from './AgentFactory';
export * from './AgentMessage';
export * from './GoalPlanner';
export * from './IAgent';
export * from './Task';

// Re-export types with a different name to avoid collisions
export { InternalAgentConfig as AgentInternalConfig };