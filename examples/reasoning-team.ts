// examples/reasoning-team.ts

import { Agent, AgentRuntime, WebSearchTool, AnthropicTool } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * This example demonstrates how to create a team of agents with different reasoning systems
 * Each agent uses the reasoning approach best suited for its specific role
 */
async function main() {
  console.log("Initializing specialized research team with different reasoning systems...\n");

  // Create a research coordinator with ReAct reasoning for complex planning
  const coordinator = new Agent(
    'research-coordinator',
    'Coordinator',
    'I organize research projects and synthesize findings into comprehensive reports',
    'Research Coordinator',
    ['Break down complex topics', 'Coordinate research efforts', 'Synthesize findings into reports'],
    [new WebSearchTool(), new AnthropicTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.5
    },
    {
      type: 'react',  // Uses ReAct for complex planning and reasoning
      maxIterations: 5,
      verbose: true   // Show reasoning steps
    }
  );

  // Create an information gatherer with standard reasoning for efficient data collection
  const researcher = new Agent(
    'researcher',
    'Researcher',
    'I specialize in gathering information efficiently from online sources',
    'Data Researcher',
    ['Find accurate information', 'Extract key data'],
    [new WebSearchTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.3
    },
    {
      type: 'standard'  // Uses standard reasoning for simple, direct responses
    }
  );

  // Create an analyst with ReAct reasoning for deep analysis
  const analyst = new Agent(
    'analyst',
    'Analyst',
    'I analyze data using step-by-step thinking to uncover insights and patterns',
    'Data Analyst',
    ['Analyze complex information', 'Identify patterns', 'Draw meaningful conclusions'],
    [new AnthropicTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.7
    },
    {
      type: 'react',  // Uses ReAct for deep analysis
      maxIterations: 4,
      verbose: true   // Show reasoning steps
    }
  );

  // Register agents with the runtime
  const runtime = new AgentRuntime();
  await runtime.registerAgent(coordinator);
  await runtime.registerAgent(researcher);
  await runtime.registerAgent(analyst);
  await runtime.start();

  console.log("Research team initialized with specialized reasoning systems:\n");
  console.log("- Coordinator: ReAct reasoning (step-by-step) for complex planning");
  console.log("- Researcher: Standard reasoning for efficient information gathering");
  console.log("- Analyst: ReAct reasoning (step-by-step) for thorough analysis\n");

  // Simulate a research workflow
  console.log("=== RESEARCH WORKFLOW ===\n");
  
  // 1. Coordinator creates a research plan
  console.log("STEP 1: Coordinator creates a research plan");
  const planResponse = await coordinator.receiveMessage({
    id: `msg-${Date.now()}-plan`,
    sender_id: 'user',
    recipient_id: coordinator.id,
    content: 'Create a research plan to investigate the crypto project known as $ARC (AI Rig Complex).',
    timestamp: Date.now()
  });
  
  console.log("\nResearch Plan:");
  console.log(planResponse.content);

  // 2. Researcher gathers information (using standard reasoning for efficiency)
  console.log("\nSTEP 2: Researcher gathers information efficiently");
  const researchResponse = await researcher.receiveMessage({
    id: `msg-${Date.now()}-research`,
    sender_id: 'coordinator',
    recipient_id: researcher.id,
    content: 'Find the latest information on quantum computing advancements and their potential timeline for breaking current encryption standards.',
    timestamp: Date.now()
  });
  
  console.log("\nResearch Findings:");
  console.log(researchResponse.content);

  // 3. Analyst performs deep analysis (using ReAct reasoning for thorough thinking)
  console.log("\nSTEP 3: Analyst performs in-depth analysis with step-by-step reasoning");
  const analysisResponse = await analyst.receiveMessage({
    id: `msg-${Date.now()}-analysis`,
    sender_id: 'coordinator',
    recipient_id: analyst.id,
    content: `Analyze these findings and identify the key implications for cybersecurity:\n\n${researchResponse.content}`,
    timestamp: Date.now()
  });
  
  console.log("\nAnalysis Results:");
  console.log(analysisResponse.content);

  // 4. Coordinator synthesizes final report
  console.log("\nSTEP 4: Coordinator synthesizes final report");
  const finalResponse = await coordinator.receiveMessage({
    id: `msg-${Date.now()}-final`,
    sender_id: 'user',
    recipient_id: coordinator.id,
    content: `Create a final report based on these research findings and analysis:\n\nFindings: ${researchResponse.content}\n\nAnalysis: ${analysisResponse.content}`,
    timestamp: Date.now()
  });
  
  console.log("\nFinal Report:");
  console.log(finalResponse.content);

  console.log("\n=== DEMONSTRATION COMPLETE ===");
  console.log("This example shows how agents with different reasoning systems can work together effectively:");
  console.log("- ReAct reasoning provides thorough step-by-step thinking for complex tasks");
  console.log("- Standard reasoning enables efficient responses for simpler information tasks");
  console.log("\nBy combining these approaches in a team, we get the benefits of both systems.");
}

// Run the example
main().catch(console.error);