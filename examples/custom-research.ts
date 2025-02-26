// examples/custom-research.ts

import { Agent, AgentRuntime, WebSearchTool, AnthropicTool, GlobalContext } from '../src';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

// Create command line interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * This example allows you to run custom research queries with the ReAct reasoning team
 */
async function main() {
  console.log("\n=== AGENTIS RESEARCH TEAM WITH REACT REASONING ===\n");
  
  // Initialize GlobalContext for temporal awareness
  const context = GlobalContext.getInstance();
  console.log("Current date context:", context.getHumanReadableDate());
  
  console.log("\nInitializing specialized research team with different reasoning systems...");

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

  console.log("\nResearch team initialized with specialized reasoning systems:");
  console.log("- Coordinator: ReAct reasoning (step-by-step) for complex planning");
  console.log("- Researcher: Standard reasoning for efficient information gathering");
  console.log("- Analyst: ReAct reasoning (step-by-step) for thorough analysis\n");

  // Get the user's research question
  rl.question('Enter your research question: ', async (query) => {
    console.log("\n=== STARTING RESEARCH PROCESS ===\n");
    
    try {
      // 1. Coordinator creates a research plan
      console.log("STEP 1: Coordinator creates a research plan");
      const planResponse = await coordinator.receiveMessage({
        id: `msg-${Date.now()}-plan`,
        sender_id: 'user',
        recipient_id: coordinator.id,
        content: `Create a research plan to investigate the following question: ${query}`,
        timestamp: Date.now()
      });
      
      console.log("\nResearch Plan:");
      console.log(planResponse.content);

      // Extract research tasks from the plan
      let researchPrompt = "Based on the research plan, please find the most relevant and up-to-date information on this topic.";
      
      // 2. Researcher gathers information
      console.log("\nSTEP 2: Researcher gathers information efficiently");
      const researchResponse = await researcher.receiveMessage({
        id: `msg-${Date.now()}-research`,
        sender_id: 'coordinator',
        recipient_id: researcher.id,
        content: `${researchPrompt}\n\nResearch topic: ${query}`,
        timestamp: Date.now()
      });
      
      console.log("\nResearch Findings:");
      console.log(researchResponse.content);

      // 3. Analyst performs deep analysis
      console.log("\nSTEP 3: Analyst performs in-depth analysis with step-by-step reasoning");
      const analysisResponse = await analyst.receiveMessage({
        id: `msg-${Date.now()}-analysis`,
        sender_id: 'coordinator',
        recipient_id: analyst.id,
        content: `Analyze these findings about "${query}" and identify the key insights and implications:\n\n${researchResponse.content}`,
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
        content: `Create a comprehensive final report addressing this research question: "${query}"\n\nBased on these findings and analysis:\n\nFindings:\n${researchResponse.content}\n\nAnalysis:\n${analysisResponse.content}`,
        timestamp: Date.now()
      });
      
      console.log("\nFINAL REPORT:");
      console.log(finalResponse.content);

      console.log("\n=== RESEARCH COMPLETE ===");
      rl.close();
    } catch (error) {
      console.error("Error during research process:", error);
      rl.close();
    }
  });
}

// Run the example
main().catch(console.error);