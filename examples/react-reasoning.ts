// examples/react-reasoning.ts

import { Agent, AgentRuntime, WebSearchTool, AnthropicTool } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * This example demonstrates the difference between standard reasoning and ReAct reasoning.
 * It compares the responses from two agents for the same complex queries.
 */
async function main() {
  console.log("Initializing agents with different reasoning systems...\n");

  // Create a standard reasoning agent
  const standardAgent = new Agent(
    'standard-agent',
    'StandardAgent',
    'I am a helpful AI assistant who provides direct answers.',
    'General Assistant',
    ['Answer questions accurately', 'Provide helpful information'],
    [new WebSearchTool(), new AnthropicTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.7
    },
    {
      type: 'standard',
      verbose: true  // Log reasoning steps
    }
  );

  // Create a ReAct reasoning agent
  const reactAgent = new Agent(
    'react-agent',
    'ReActAgent',
    'I am a thoughtful AI assistant who reasons step-by-step.',
    'Reasoning Specialist',
    ['Break down problems', 'Think step-by-step', 'Use tools effectively'],
    [new WebSearchTool(), new AnthropicTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.7
    },
    {
      type: 'react',
      maxIterations: 5,
      verbose: true  // Log reasoning steps
    }
  );

  // Initialize runtime with both agents
  const runtime = new AgentRuntime();
  await runtime.registerAgent(standardAgent);
  await runtime.registerAgent(reactAgent);
  await runtime.start();

  console.log("Both agents initialized!\n");

  // Define test query that benefits from step-by-step reasoning
  const testQuery = "What would happen if the moon were twice as massive as it is now? Consider effects on tides, Earth's orbit, and other consequences.";

  // Test the query with both agents
  console.log("\n=== QUERY ===");
  console.log(`Query: ${testQuery}`);
  console.log("\n--- Standard Agent Response ---");
  
  const standardResponse = await standardAgent.receiveMessage({
    id: `msg-${Date.now()}-standard`,
    sender_id: 'user',
    recipient_id: standardAgent.id,
    content: testQuery,
    timestamp: Date.now()
  });
  
  console.log(`\nStandard Agent Response:\n${standardResponse.content}\n`);
  
  console.log("\n--- ReAct Agent Response ---");
  
  const reactResponse = await reactAgent.receiveMessage({
    id: `msg-${Date.now()}-react`,
    sender_id: 'user',
    recipient_id: reactAgent.id,
    content: testQuery,
    timestamp: Date.now()
  });
  
  console.log(`\nReAct Agent Response:\n${reactResponse.content}\n`);
  
  // Log detailed comparison
  console.log("\n=== COMPARISON ===");
  console.log("Standard reasoning: Direct response without showing steps");
  console.log("ReAct reasoning: Step-by-step reasoning process with explicit thoughts and tool use");
  console.log("\nTest complete!");
}

// Run the example
main().catch(console.error);