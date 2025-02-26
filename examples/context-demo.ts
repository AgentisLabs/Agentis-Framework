// examples/context-demo.ts

import { Agent, AgentRuntime, WebSearchTool, AnthropicTool, GlobalContext } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * This example demonstrates the use of GlobalContext to provide temporal awareness
 * to agents, ensuring they have accurate information about the current date/time.
 */
async function main() {
  console.log("\n=== TEMPORAL CONTEXT DEMONSTRATION ===\n");
  
  // Get the GlobalContext instance
  const globalContext = GlobalContext.getInstance();
  
  // Display the current context
  console.log("Current Temporal Context:");
  console.log(globalContext.getTemporalContext());
  console.log("\nInitializing agents with temporal awareness...\n");

  // Create a temporally-aware agent with standard reasoning
  const standardAgent = new Agent(
    'standard-agent',
    'TemporalAgent',
    'I am an AI assistant with awareness of the current date and time',
    'Information Specialist',
    ['Provide accurate, timely information', 'Reference current date in responses'],
    [new WebSearchTool(), new AnthropicTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.7
    }
  );

  // Initialize runtime
  const runtime = new AgentRuntime();
  await runtime.registerAgent(standardAgent);
  await runtime.start();

  console.log("Agent initialized with current date context!\n");

  // Test queries that require temporal awareness
  const queries = [
    "What is today's date?",
    "How many days are left in the current month?",
    "What major events have happened in the world in the last 30 days?",
    "When was the last US presidential election and when is the next one?"
  ];

  // Process each query
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`\n--- QUERY ${i+1} ---`);
    console.log(`Query: ${query}\n`);
    
    const response = await standardAgent.receiveMessage({
      id: `msg-${Date.now()}-${i}`,
      sender_id: 'user',
      recipient_id: standardAgent.id,
      content: query,
      timestamp: Date.now()
    });
    
    console.log(`Response:\n${response.content}\n`);
  }

  // Demonstrate time manipulation (for testing)
  console.log("\n--- TIME SIMULATION ---");
  console.log("Current date context:", globalContext.getFormattedDate());
  
  // Set date to future (6 months from now)
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 6);
  globalContext.setDate(futureDate);
  
  console.log("Simulated future date:", globalContext.getFormattedDate());
  
  // Ask about the new "current" date
  console.log("\nQuery: What is today's date, and what season is it in the northern hemisphere?\n");
  
  const futureResponse = await standardAgent.receiveMessage({
    id: `msg-${Date.now()}-future`,
    sender_id: 'user',
    recipient_id: standardAgent.id,
    content: "What is today's date, and what season is it in the northern hemisphere?",
    timestamp: Date.now()
  });
  
  console.log(`Response:\n${futureResponse.content}\n`);
  
  // Reset to actual current date
  globalContext.setDate(new Date());
  console.log("Reset to actual current date:", globalContext.getFormattedDate());
  
  console.log("\n=== DEMONSTRATION COMPLETE ===");
  console.log("The GlobalContext provider ensures agents are aware of the current date and time");
  console.log("This helps them provide timely, relevant information and avoid outdated responses");
}

// Run the example
main().catch(console.error);