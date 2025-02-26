// examples/research-team.ts

import { Agent, AgentRuntime, WebSearchTool, AnthropicTool, OpenRouterTool } from '../src';
import * as dotenv from 'dotenv';
import { AgentMessage } from '../src/agents/AgentMessage';
// Initialize dotenv at the top of the file to ensure environment variables are loaded

dotenv.config();

/**
 * This example demonstrates a 3-agent research team collaborating on a research task.
 * Each agent has a specialized role and uses a specific LLM provider.
 */
async function main() {
  // Create a research coordinator using Anthropic's Claude
  const coordinator = new Agent(
    'research-coordinator',
    'ResearchCoordinator',
    'I am a research coordinator who breaks down complex research queries into subtasks, assigns them to specialists, and synthesizes their findings into comprehensive reports.',
    'Research Coordinator',
    ['Coordinate research efforts', 'Synthesize findings', 'Generate comprehensive reports'],
    [new AnthropicTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.5,
      maxTokens: 4096
    }
  );

  // Create a web researcher using OpenAI
  const webResearcher = new Agent(
    'web-researcher',
    'WebResearcher',
    'I am a web researcher specialized in gathering and analyzing information from online sources. I excel at finding facts, statistics, and recent developments on any topic.',
    'Web Research Specialist',
    ['Gather comprehensive information', 'Find recent developments', 'Verify factual accuracy'],
    [new WebSearchTool()],
    {
      provider: 'openai',
      name: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 2048
    }
  );

  // Create an analyst using OpenRouter
  const analyst = new Agent(
    'analyst',
    'DataAnalyst',
    'I am a data analyst specialized in interpreting research findings, identifying patterns, and drawing insightful conclusions. I excel at critical analysis and providing nuanced perspectives on complex topics.',
    'Analysis Specialist',
    ['Analyze research findings', 'Identify patterns and insights', 'Draw meaningful conclusions'],
    [new OpenRouterTool()],
    {
      provider: 'openrouter',
      name: 'anthropic/claude-3-sonnet-20240229',
      temperature: 0.4,
      maxTokens: 3000
    }
  );

  // Initialize runtime and register agents
  const runtime = new AgentRuntime();
  await runtime.registerAgent(coordinator);
  await runtime.registerAgent(webResearcher);
  await runtime.registerAgent(analyst);
  
  console.log('Research team initialized:');
  console.log(`- ${coordinator.name}: Coordinates research and synthesizes findings`);
  console.log(`- ${webResearcher.name}: Gathers information from web sources`);
  console.log(`- ${analyst.name}: Analyzes findings and draws conclusions`);

  // The research topic
  const researchTopic = "Advancements in fusion energy technology in the last 2 years";
  
  // Coordinator breaks down the task
  console.log('\n--- Research Coordination ---');
  const coordinationMessage = await coordinator.receiveMessage({
    id: `msg-${Date.now()}-coord`,
    sender_id: 'user',
    recipient_id: coordinator.id,
    content: `We need to research "${researchTopic}". Break this down into specific research questions for our web researcher.`,
    timestamp: Date.now()
  });
  
  console.log(`Coordinator's plan:\n${coordinationMessage.content}\n`);
  
  // Extract research questions from coordinator's response
  const lines = coordinationMessage.content.split('\n');
  const researchQuestions = lines
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
    .filter(line => line.length > 10 && line.endsWith('?'));
  
  // Limit to 3 questions for the example
  const topQuestions = researchQuestions.slice(0, 3);
  console.log('Top research questions:');
  topQuestions.forEach(q => console.log(`- ${q}`));
  
  // Web researcher investigates each question
  console.log('\n--- Web Research Phase ---');
  const researchFindings = [];
  
  for (const question of topQuestions) {
    console.log(`\nResearching: ${question}`);
    const researchMessage = await webResearcher.receiveMessage({
      id: `msg-${Date.now()}-research-${topQuestions.indexOf(question)}`,
      sender_id: 'coordinator',
      recipient_id: webResearcher.id,
      content: `Research this question thoroughly: ${question}\nProvide factual, up-to-date information with specific details and examples.`,
      timestamp: Date.now()
    });
    
    console.log(`Research findings: ${researchMessage.content.substring(0, 150)}...`);
    researchFindings.push({
      question,
      findings: researchMessage.content
    });
  }
  
  // Analyst evaluates the findings
  console.log('\n--- Analysis Phase ---');
  const analysisResults = [];
  
  for (const research of researchFindings) {
    console.log(`\nAnalyzing findings for: ${research.question}`);
    const analysisMessage = await analyst.receiveMessage({
      id: `msg-${Date.now()}-analysis-${researchFindings.indexOf(research)}`,
      sender_id: 'coordinator',
      recipient_id: analyst.id,
      content: `Analyze these research findings on "${research.question}":\n\n${research.findings}\n\nProvide critical analysis, identify key insights, and draw meaningful conclusions.`,
      timestamp: Date.now()
    });
    
    console.log(`Analysis: ${analysisMessage.content.substring(0, 150)}...`);
    analysisResults.push({
      question: research.question,
      analysis: analysisMessage.content
    });
  }
  
  // Coordinator synthesizes the final report
  console.log('\n--- Final Synthesis ---');
  
  // Prepare the synthesis prompt
  let synthesisPrompt = `Synthesize the following research and analysis on "${researchTopic}" into a comprehensive final report:\n\n`;
  
  for (let i = 0; i < researchFindings.length; i++) {
    synthesisPrompt += `RESEARCH QUESTION: ${researchFindings[i].question}\n`;
    synthesisPrompt += `FINDINGS: ${researchFindings[i].findings}\n`;
    synthesisPrompt += `ANALYSIS: ${analysisResults[i].analysis}\n\n`;
  }
  
  synthesisPrompt += `Create a well-structured final report that integrates all this information. Include an introduction, key findings organized by theme, implications, and conclusion.`;
  
  const finalReport = await coordinator.receiveMessage({
    id: `msg-${Date.now()}-synthesis`,
    sender_id: 'user',
    recipient_id: coordinator.id,
    content: synthesisPrompt,
    timestamp: Date.now()
  });
  
  console.log('\n--- FINAL RESEARCH REPORT ---\n');
  console.log(finalReport.content);
}

// Run the example
main().catch(console.error);