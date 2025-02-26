// examples/comprehensive-example.ts

import { Agent, AgentRuntime, WebSearchTool, AnthropicTool, OpenRouterTool, GlobalContext } from '../src';
import { GraphBuilder, EnhancedToolOrchestrator } from '../src/tools';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

// Create command line interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * This comprehensive example showcases all key features of the Agentis Framework:
 * - ReAct reasoning capabilities
 * - Temporal context awareness
 * - Different LLM providers
 * - Advanced tool orchestration
 * - Multi-agent collaboration
 */
async function main() {
  console.log("\n=== AGENTIS FRAMEWORK COMPREHENSIVE DEMO ===\n");
  
  // Initialize GlobalContext for temporal awareness
  const context = GlobalContext.getInstance();
  console.log("Current date:", context.getHumanReadableDate());
  
  console.log("\nInitializing enhanced agent team with different capabilities...");

  // Create a strategist with ReAct reasoning using Anthropic
  const strategist = new Agent(
    'strategist',
    'Strategist',
    'I create comprehensive strategies and coordinate research activities. I use step-by-step reasoning to solve complex problems.',
    'Strategy Specialist',
    ['Plan comprehensive strategies', 'Coordinate research activities', 'Integrate findings into actionable insights'],
    [new WebSearchTool(), new AnthropicTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.5
    },
    {
      type: 'react',  // Uses ReAct for complex planning and reasoning
      maxIterations: 5,
      verbose: true
    }
  );

  // Create a researcher using OpenRouter with standard reasoning
  const researcher = new Agent(
    'researcher',
    'Researcher',
    'I gather and analyze information from multiple sources efficiently.',
    'Information Specialist',
    ['Find accurate information', 'Analyze data from diverse sources'],
    [new WebSearchTool()],
    {
      provider: 'openrouter',
      name: 'anthropic/claude-3-sonnet-20240229',
      temperature: 0.3
    },
    {
      type: 'standard'  // Uses standard reasoning for efficient responses
    }
  );

  // Create a report generator using Anthropic with standard reasoning
  const reportGenerator = new Agent(
    'report-generator',
    'ReportGenerator',
    'I transform research findings into well-structured, comprehensive reports.',
    'Content Specialist',
    ['Generate comprehensive reports', 'Organize information clearly', 'Highlight key insights'],
    [new AnthropicTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.4
    },
    {
      type: 'standard'
    }
  );

  // Initialize runtime and register agents
  const runtime = new AgentRuntime();
  await runtime.registerAgent(strategist);
  await runtime.registerAgent(researcher);
  await runtime.registerAgent(reportGenerator);
  await runtime.start();

  console.log("\nEnhanced agent team initialized successfully!");
  console.log("- Strategist: Uses ReAct reasoning for step-by-step planning");
  console.log("- Researcher: Uses web search for information gathering");
  console.log("- Report Generator: Creates comprehensive reports from findings");
  console.log("\nThis team combines advanced reasoning, temporal awareness, and multi-provider capabilities.");

  // Create tool orchestrator for advanced operations
  const orchestrator = new EnhancedToolOrchestrator({
    defaultTools: [new WebSearchTool(), new AnthropicTool()]
  });

  // Get the user's research topic
  rl.question('\nEnter a research topic to investigate: ', async (topic) => {
    try {
      console.log("\n=== BEGINNING COMPREHENSIVE RESEARCH WORKFLOW ===\n");
      
      // Phase 1: Strategy Development with ReAct reasoning
      console.log("PHASE 1: Strategy Development (ReAct reasoning)");
      const strategyPrompt = `Develop a comprehensive research strategy to investigate the following topic: "${topic}". The strategy should include: key aspects to research, methodological approach, and specific questions to answer.`;
      
      const strategyResponse = await strategist.receiveMessage({
        id: `msg-${Date.now()}-strategy`,
        sender_id: 'user',
        recipient_id: strategist.id,
        content: strategyPrompt,
        timestamp: Date.now()
      });
      
      console.log("\nResearch Strategy:");
      console.log(strategyResponse.content);
      
      // Phase 2: Parallel Information Gathering with Tool Orchestration
      console.log("\nPHASE 2: Parallel Information Gathering (Tool Orchestration)");
      console.log("Building parallel research execution graph...");
      
      // Extract research questions from strategy
      const researchQuestions = extractQuestionsFromStrategy(strategyResponse.content);
      
      // Build parallel execution graph
      const graph = new GraphBuilder();
      
      // Add searches for each question
      for (let i = 0; i < researchQuestions.length; i++) {
        graph.addTool(
          `search-${i+1}`, 
          'WebSearchTool', 
          `${topic} ${researchQuestions[i]}`, 
          0
        );
      }
      
      // Add analysis tool to process results
      graph.addDependentTool(
        'analysis',
        'AnthropicTool',
        (context) => {
          let results = "";
          for (let i = 0; i < researchQuestions.length; i++) {
            const questionResult = context.getPreviousResult(`search-${i+1}`)?.result || '';
            results += `Question ${i+1}: ${researchQuestions[i]}\nFindings: ${questionResult}\n\n`;
          }
          return `Analyze the following research findings about "${topic}":\n\n${results}`;
        },
        researchQuestions.map((_, i) => `search-${i+1}`),
        1
      );
      
      // Execute the graph using the strategist's ID (since they're coordinating the research)
      console.log(`Executing parallel research on ${researchQuestions.length} aspects...`);
      let analysis = '';
      
      try {
        const results = await orchestrator.executeGraph(graph.parallel(2).build(), strategist.id);
        analysis = results.get('analysis')?.result || 'No analysis generated';
        console.log("\nParallel Research Complete!");
      } catch (error) {
        console.error("Error during parallel research:", error);
        console.log("\nFalling back to sequential research due to error in parallel execution...");
        
        // Fallback: Do sequential research instead
        let findings = '';
        for (let i = 0; i < researchQuestions.length; i++) {
          try {
            console.log(`Researching question ${i+1}/${researchQuestions.length}...`);
            const webTool = new WebSearchTool();
            const searchResult = await webTool.execute(`${topic} ${researchQuestions[i]}`);
            findings += `Question ${i+1}: ${researchQuestions[i]}\nFindings: ${searchResult.result || 'No results'}\n\n`;
          } catch (searchError) {
            findings += `Question ${i+1}: ${researchQuestions[i]}\nFindings: Error retrieving information\n\n`;
          }
        }
        
        // Process findings sequentially
        const analysisTool = new AnthropicTool();
        const analysisResult = await analysisTool.execute(`Analyze the following research findings about "${topic}":\n\n${findings}`);
        analysis = analysisResult.result || 'No analysis generated';
        console.log("\nSequential Research Complete!");
      }
      
      // Phase 3: Deeper Investigation by the Researcher
      console.log("\nPHASE 3: Deeper Investigation (Web Search + Standard Reasoning)");
      const researchPrompt = `Based on these initial findings, please conduct deeper research on "${topic}" with special attention to recent developments as of ${context.getFormattedDate()}.\n\nInitial findings:\n${analysis}`;
      
      const researchResponse = await researcher.receiveMessage({
        id: `msg-${Date.now()}-research`,
        sender_id: 'strategist',
        recipient_id: researcher.id,
        content: researchPrompt,
        timestamp: Date.now()
      });
      
      console.log("\nDeeper Research Findings:");
      console.log(researchResponse.content);
      
      // Phase 4: Report Generation
      console.log("\nPHASE 4: Comprehensive Report Generation");
      const reportPrompt = `Create a comprehensive report on "${topic}" using all of the following information:\n\n1. Research Strategy:\n${strategyResponse.content}\n\n2. Initial Analysis:\n${analysis}\n\n3. Deeper Research Findings:\n${researchResponse.content}\n\nThe report should be well-structured with an executive summary, key findings, analysis, and recommendations. Include the current date (${context.getFormattedDate()}) in the report.`;
      
      const reportResponse = await reportGenerator.receiveMessage({
        id: `msg-${Date.now()}-report`,
        sender_id: 'strategist',
        recipient_id: reportGenerator.id,
        content: reportPrompt,
        timestamp: Date.now()
      });
      
      console.log("\n=== FINAL COMPREHENSIVE REPORT ===\n");
      console.log(reportResponse.content);
      
      console.log("\n=== COMPREHENSIVE DEMO COMPLETE ===\n");
      console.log("This example demonstrated the full capabilities of the Agentis Framework:");
      console.log("1. ReAct reasoning for step-by-step problem solving");
      console.log("2. Temporal context awareness for current information");
      console.log("3. Multiple LLM providers working together");
      console.log("4. Parallel tool orchestration for efficient research");
      console.log("5. Specialized agent roles for optimal results");
      console.log("\nThank you for exploring the Agentis Framework!");
      
      rl.close();
    } catch (error) {
      console.error("Error during demo:", error);
      rl.close();
    }
  });
}

/**
 * Extracts research questions from a strategy document
 */
function extractQuestionsFromStrategy(strategy: string): string[] {
  // Look for questions in the strategy text
  const questions: string[] = [];
  const lines = strategy.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Look for lines with question format patterns
    if ((trimmedLine.match(/^\d+\./) || trimmedLine.match(/^-/) || trimmedLine.match(/^•/)) && 
        (trimmedLine.includes('?') || 
         trimmedLine.toLowerCase().includes('what') || 
         trimmedLine.toLowerCase().includes('how') || 
         trimmedLine.toLowerCase().includes('why'))) {
      // Remove any leading numbers, dashes, etc.
      const question = trimmedLine.replace(/^[\d\-•\*]+\.?\s*/, '');
      if (question.length > 10) {
        questions.push(question);
      }
    }
  }
  
  // If we couldn't find specific questions, create some based on topic headers
  if (questions.length === 0) {
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.match(/^#{1,3}\s+/) && !trimmedLine.toLowerCase().includes('introduction') && 
          !trimmedLine.toLowerCase().includes('conclusion') && trimmedLine.length > 10) {
        const topic = trimmedLine.replace(/^#{1,3}\s+/, '');
        questions.push(`What are the key aspects of ${topic}?`);
      }
    }
  }
  
  // If still no questions found, create some generic research questions
  if (questions.length === 0) {
    questions.push(
      "What are the latest developments in this field?",
      "What are the key challenges and opportunities?",
      "Who are the major players or contributors?",
      "What are the future trends and predictions?"
    );
  }
  
  // Limit to max 4 questions to avoid overwhelming the system
  return questions.slice(0, 4);
}

// Run the example
main().catch(console.error);