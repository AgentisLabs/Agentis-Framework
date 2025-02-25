import { AgentFactory } from '../agents/AgentFactory';
import { AgentMessage } from '../agents/AgentMessage';
import { AgentRuntime } from '../runtime/AgentRuntime';
import { createInterface } from 'readline';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { WebSearchTool } from '../tools/WebSearchTool';
import { AnthropicTool } from '../tools/AnthropicTool';
import { getTeam } from '../config/framework-config';
import { IAgent } from '../agents/IAgent';
import { EnhancedToolOrchestrator, ExecutionMode } from '../tools/EnhancedToolOrchestrator';
import { GraphBuilder } from '../tools/GraphBuilder';
import { ConsoleFormatter } from '../utils/ConsoleFormatter';

// Print a formatted title
console.log(ConsoleFormatter.formatTitle("Agentis Framework - Multi-Agent Chat Demo"));

// Print environment information
console.log(ConsoleFormatter.formatHeading("Environment"));
console.log(ConsoleFormatter.formatList([
  `OpenRouter API Key: ${!!process.env.OPENROUTER_API_KEY ? "Available" : "MISSING"}`,
  `URL: ${process.env.NEXT_PUBLIC_URL || "Not set"}`
]));
console.log(ConsoleFormatter.formatSeparator());

// Create readline interface for terminal input
const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise wrapper for readline question
const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => readline.question(query, resolve));
};

async function main() {
  const runtime = new AgentRuntime();
  
  // Get team configuration and create agent instances
  const researchTeamConfig = getTeam('cryptoResearch');
  const agents: IAgent[] = [];
  
  // Create agent instances from configs
  for (const config of researchTeamConfig) {
    const agent = await AgentFactory.createAgent(config);
    agents.push(agent);
    runtime.registerAgent(agent);
  }
  
  await runtime.start();

  console.log(ConsoleFormatter.formatSuccess("Crypto Research Team Ready!"));
  console.log(ConsoleFormatter.formatHeading("Team Members"));
  console.log(ConsoleFormatter.formatList([
    "Market Researcher (Deep Research)",
    "Technical Analyst (Market Analysis)",
    "Strategy Master (Coordination)"
  ]));

  // Get user input for the research task
  const userTask = await askQuestion(ConsoleFormatter.FG_YELLOW + ConsoleFormatter.BRIGHT + "Enter your research task: " + ConsoleFormatter.RESET);

  // First, let the goal planner create a structured research plan
  const plannerMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[2].id, // Goal Planner
    content: `Create a focused research plan for: ${userTask}. 
    Break down what specific aspects the Market Researcher should investigate (tokenomics, team, technology, etc.) 
    and what the Technical Analyst should analyze (price action, volume, market structure, etc.).`,
    timestamp: Date.now()
  };

  // Create a spinner for the planning phase
  const planningSpinner = ConsoleFormatter.createSpinner("Strategy Master creating research plan");
  planningSpinner.start();
  
  const planningResponse = await agents[2].receiveMessage(plannerMessage);
  planningSpinner.stop(true);
  
  // Set up the enhanced tool orchestrator for parallel research
  const researcher = agents[0];
  const toolOrchestrator = new EnhancedToolOrchestrator({
    defaultTools: [
      new WebSearchTool(),
      new AnthropicTool()
    ]
  });

  // Create parallel research execution graph
  console.log(ConsoleFormatter.formatStatus("Market Researcher investigating with parallel tool execution"));
  
  // Create a progress bar for research
  const researchProgress = ConsoleFormatter.createProgressBar(6);
  researchProgress.update(0, "Starting research");
  
  const researchGraph = new GraphBuilder()
    // Search for different aspects in parallel
    .addTool(
      'project-overview', 
      'WebSearchTool', 
      `${userTask} project overview technology blockchain`, 
      0
    )
    .addTool(
      'team-background', 
      'WebSearchTool', 
      `${userTask} team background founders developers credibility`, 
      0
    )
    .addTool(
      'tokenomics', 
      'WebSearchTool', 
      `${userTask} tokenomics token distribution supply economics`, 
      0
    )
    .addTool(
      'recent-news', 
      'WebSearchTool', 
      `${userTask} latest news recent developments updates`, 
      0
    )
    .addTool(
      'competitors', 
      'WebSearchTool', 
      `${userTask} market competitors similar projects comparison`, 
      0
    )
    // Then analyze all collected data
    .addDependentTool(
      'research-synthesis',
      'AnthropicTool',
      (context) => {
        // Combine all research data
        const overview = context.getPreviousResult('project-overview')?.result || '';
        const team = context.getPreviousResult('team-background')?.result || '';
        const tokenomics = context.getPreviousResult('tokenomics')?.result || '';
        const news = context.getPreviousResult('recent-news')?.result || '';
        const competitors = context.getPreviousResult('competitors')?.result || '';
        
        return `You are a crypto market researcher. Synthesize the following research data about ${userTask} into a comprehensive report with these sections:
        1. Project Overview & Technology
        2. Team Background & Credibility
        3. Tokenomics & Distribution
        4. Recent Developments & News
        5. Market Position & Competitors
        
        Research Plan Context: ${planningResponse.content}
        
        PROJECT OVERVIEW DATA:
        ${overview.substring(0, 1000)}...
        
        TEAM BACKGROUND DATA:
        ${team.substring(0, 1000)}...
        
        TOKENOMICS DATA:
        ${tokenomics.substring(0, 1000)}...
        
        RECENT NEWS DATA:
        ${news.substring(0, 1000)}...
        
        COMPETITORS DATA:
        ${competitors.substring(0, 1000)}...
        
        Please provide specific, factual information, not generic responses. Focus on the most important aspects from each section.`;
      },
      ['project-overview', 'team-background', 'tokenomics', 'recent-news', 'competitors'],
      1
    )
    .parallel(2) // Execute searches with max 2 concurrent requests
    .build();
  
  // Execute the research graph with progress updates
  let completed = 0;
  
  // Add interceptor to update progress
  const originalExecuteSingleNode = toolOrchestrator['executeSingleNode'];
  toolOrchestrator['executeSingleNode'] = async (node, context) => {
    researchProgress.update(completed, `Running ${node.toolName}`);
    const result = await originalExecuteSingleNode.call(toolOrchestrator, node, context);
    completed++;
    researchProgress.update(completed, `Completed ${node.toolName}`);
    return result;
  };
  
  const researchResults = await toolOrchestrator.executeGraph(researchGraph, researcher.id);
  researchProgress.complete("Research data collection complete");
  
  // Get the final synthesized research
  const researchSynthesis = researchResults.get('research-synthesis')?.result || '';
  
  // Create a research message with the synthesized data
  const researchMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: agents[2].id,
    recipient_id: agents[0].id,
    content: `Finalize this research on ${userTask}:
    
    ${researchSynthesis}
    
    Research Plan Context: ${planningResponse.content}
    
    Add any other important insights and ensure all information is accurate and relevant.`,
    timestamp: Date.now()
  };

  // Create a spinner for finalizing research
  const researchSpinner = ConsoleFormatter.createSpinner("Market Researcher finalizing research");
  researchSpinner.start();
  
  const researchResponse = await agents[0].receiveMessage(researchMessage);
  researchSpinner.stop(true);
  
  // Display research findings
  console.log(ConsoleFormatter.formatAgentMessage(
    "Market Researcher", 
    "Research Analyst", 
    researchResponse.content
  ));

  // Technical analysis with parallel data collection and analysis
  const analyst = agents[1];
  
  // Create a technical analysis execution graph
  console.log(ConsoleFormatter.formatStatus("Technical Analyst processing with orchestrated tools"));
  
  // Create a progress bar for technical analysis
  const technicalProgress = ConsoleFormatter.createProgressBar(6);
  technicalProgress.update(0, "Starting technical analysis");
  
  const technicalGraph = new GraphBuilder()
    // Get price and market cap data
    .addTool(
      'price-data', 
      'WebSearchTool', 
      `${userTask} current price market cap trading volume today`, 
      0
    )
    // Get technical indicators
    .addTool(
      'technical-indicators', 
      'WebSearchTool', 
      `${userTask} technical indicators RSI MACD moving averages`, 
      0
    )
    // Get support/resistance levels
    .addTool(
      'support-resistance', 
      'WebSearchTool', 
      `${userTask} support resistance levels price chart analysis`, 
      0
    )
    // Get volume analysis
    .addTool(
      'volume-analysis', 
      'WebSearchTool', 
      `${userTask} trading volume analysis trends liquidity`, 
      0
    )
    // Get market patterns
    .addTool(
      'market-patterns', 
      'WebSearchTool', 
      `${userTask} chart patterns market structure trend analysis`, 
      0
    )
    // Then analyze all collected data
    .addDependentTool(
      'technical-synthesis',
      'AnthropicTool',
      (context) => {
        // Combine all technical data
        const priceData = context.getPreviousResult('price-data')?.result || '';
        const indicators = context.getPreviousResult('technical-indicators')?.result || '';
        const supportResistance = context.getPreviousResult('support-resistance')?.result || '';
        const volumeAnalysis = context.getPreviousResult('volume-analysis')?.result || '';
        const patterns = context.getPreviousResult('market-patterns')?.result || '';
        
        return `You are a crypto technical analyst. Analyze the following market data about ${userTask} and create a comprehensive technical analysis report with these sections:
        1. Current Price & Market Cap
        2. Volume Analysis & Trends
        3. Key Support/Resistance Levels
        4. Technical Indicators Assessment
        5. Market Structure & Patterns
        
        Research Context: ${researchResponse.content.substring(0, 1000)}...
        
        PRICE & MARKET CAP DATA:
        ${priceData.substring(0, 1000)}...
        
        TECHNICAL INDICATORS DATA:
        ${indicators.substring(0, 1000)}...
        
        SUPPORT/RESISTANCE DATA:
        ${supportResistance.substring(0, 1000)}...
        
        VOLUME ANALYSIS DATA:
        ${volumeAnalysis.substring(0, 1000)}...
        
        MARKET PATTERNS DATA:
        ${patterns.substring(0, 1000)}...
        
        Please provide specific technical analysis with concrete data points and metrics. Include price ranges, volume figures, indicator values, and clearly identified patterns where possible.`;
      },
      ['price-data', 'technical-indicators', 'support-resistance', 'volume-analysis', 'market-patterns'],
      1
    )
    .parallel(3) // Execute with max 3 concurrent requests
    .build();
  
  // Reset the counter for technical analysis progress
  completed = 0;
  
  // Update the interceptor
  toolOrchestrator['executeSingleNode'] = async (node, context) => {
    technicalProgress.update(completed, `Running ${node.toolName}`);
    const result = await originalExecuteSingleNode.call(toolOrchestrator, node, context);
    completed++;
    technicalProgress.update(completed, `Completed ${node.toolName}`);
    return result;
  };
  
  // Execute the technical analysis graph
  const technicalResults = await toolOrchestrator.executeGraph(technicalGraph, analyst.id);
  technicalProgress.complete("Technical analysis data collection complete");
  
  // Get the final synthesized technical analysis
  const technicalSynthesis = technicalResults.get('technical-synthesis')?.result || '';
  
  // Create a technical analysis message with the synthesized data
  const technicalMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: agents[2].id,
    recipient_id: agents[1].id,
    content: `Finalize this technical analysis for ${userTask}:
    
    ${technicalSynthesis}
    
    Research Context: ${researchResponse.content.substring(0, 1000)}...
    
    Add your expert insights and ensure all technical data is accurate and properly interpreted.`,
    timestamp: Date.now()
  };

  // Create a spinner for finalizing technical analysis
  const technicalSpinner = ConsoleFormatter.createSpinner("Technical Analyst finalizing analysis");
  technicalSpinner.start();
  
  const technicalResponse = await agents[1].receiveMessage(technicalMessage);
  technicalSpinner.stop(true);
  
  // Display technical analysis
  console.log(ConsoleFormatter.formatAgentMessage(
    "Technical Analyst",
    "Market Analyst",
    technicalResponse.content
  ));

  // Final synthesis with orchestrated data integration and analysis
  const coordinator = agents[2];
  
  // Create a final synthesis execution graph
  console.log(ConsoleFormatter.formatStatus("Strategy Master orchestrating final synthesis"));
  
  // Create a progress bar for synthesis
  const synthesisProgress = ConsoleFormatter.createProgressBar(3);
  synthesisProgress.update(0, "Starting final synthesis");
  
  const synthesisGraph = new GraphBuilder()
    // Get sentiment analysis for additional context
    .addTool(
      'sentiment-analysis', 
      'WebSearchTool', 
      `${userTask} market sentiment social media community feedback`, 
      0
    )
    // Get recent price action
    .addTool(
      'recent-price-action', 
      'WebSearchTool', 
      `${userTask} price movement last 7 days market reaction`, 
      0
    )
    // Synthesize everything together
    .addDependentTool(
      'final-synthesis',
      'AnthropicTool',
      (context) => {
        // Get additional context
        const sentiment = context.getPreviousResult('sentiment-analysis')?.result || '';
        const recentPrice = context.getPreviousResult('recent-price-action')?.result || '';
        
        return `You are a crypto strategy coordinator. Create a comprehensive final analysis for ${userTask} by integrating all the following information:

        FUNDAMENTAL RESEARCH:
        ${researchResponse.content.substring(0, 2000)}...
        
        TECHNICAL ANALYSIS:
        ${technicalResponse.content.substring(0, 2000)}...
        
        MARKET SENTIMENT:
        ${sentiment.substring(0, 1000)}...
        
        RECENT PRICE ACTION:
        ${recentPrice.substring(0, 1000)}...
        
        Structure your response with:
        1. Executive Summary (key takeaways in bullet points)
        2. Fundamental Strengths & Risks
        3. Technical Outlook (short and medium-term)
        4. Market Sentiment Analysis
        5. Strategic Recommendations (concrete actionable insights)
        
        Focus on providing specific, actionable insights. Highlight opportunities and risks. Be precise with numbers and data points where available.`;
      },
      ['sentiment-analysis', 'recent-price-action'],
      1
    )
    .sequential() // Execute in sequential order
    .build();
  
  // Reset the counter for synthesis progress
  completed = 0;
  
  // Update the interceptor again
  toolOrchestrator['executeSingleNode'] = async (node, context) => {
    synthesisProgress.update(completed, `Running ${node.toolName}`);
    const result = await originalExecuteSingleNode.call(toolOrchestrator, node, context);
    completed++;
    synthesisProgress.update(completed, `Completed ${node.toolName}`);
    return result;
  };
  
  // Execute the synthesis graph
  const synthesisResults = await toolOrchestrator.executeGraph(synthesisGraph, coordinator.id);
  synthesisProgress.complete("Final synthesis data collection complete");
  
  // Get the final synthesized analysis
  const finalSynthesis = synthesisResults.get('final-synthesis')?.result || '';
  
  // Create a synthesis message with the orchestrated data
  const synthesisMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[2].id,
    content: `Review and finalize this comprehensive analysis for ${userTask}:
    
    ${finalSynthesis}
    
    Ensure the analysis is balanced, data-driven, and provides actionable insights. Add any crucial information that might be missing.`,
    timestamp: Date.now()
  };

  // Create a spinner for finalizing the analysis
  const finalSpinner = ConsoleFormatter.createSpinner("Strategy Master finalizing insights");
  finalSpinner.start();
  
  const finalResponse = await agents[2].receiveMessage(synthesisMessage);
  finalSpinner.stop(true);
  
  // Display the final analysis with a title
  console.log(ConsoleFormatter.formatTitle(`Analysis Results for: ${userTask}`));
  console.log(ConsoleFormatter.formatAgentMessage(
    "Strategy Master",
    "Coordinator",
    finalResponse.content
  ));

  // Display a completion message
  console.log(ConsoleFormatter.formatSeparator());
  console.log(ConsoleFormatter.formatSuccess("Analysis complete"));
  console.log(ConsoleFormatter.formatTitle("Agentis Framework"));
  
  // Close readline interface
  readline.close();
}

// Run the interactive session
main().catch(console.error); 