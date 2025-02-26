// src/agents/reasoning/IReasoner.ts

/**
 * Interface for reasoning systems that can be used by agents
 * This allows for different reasoning approaches (standard, ReAct, Chain-of-Thought, etc.)
 */
export interface IReasoner {
  /**
   * Process a user query and generate a response using the reasoning approach
   * @param query The user's query
   * @returns The final response after reasoning
   */
  process(query: string): Promise<string>;
}