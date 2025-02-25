import { EnhancedToolOrchestrator, ExecutionMode } from '../tools/EnhancedToolOrchestrator';
import { GraphBuilder } from '../tools/GraphBuilder';
import { WebSearchTool } from '../tools/WebSearchTool';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { AnthropicTool } from '../tools/AnthropicTool';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example of tool orchestration using the enhanced orchestrator
 */
async function testToolOrchestration() {
  // Create the tool orchestrator with some tools
  const orchestrator = new EnhancedToolOrchestrator({
    defaultTools: [
      new WebSearchTool(),
      new OpenRouterTool(),
      new AnthropicTool()
    ],
    cacheExpiryMs: 60000 // 1 minute cache
  });

  // Example 1: Sequential Chain
  console.log('\n=== EXAMPLE 1: SEQUENTIAL CHAIN ===');
  
  const sequentialGraph = GraphBuilder.createSequentialChain({
    tools: [
      {
        toolName: 'WebSearchTool',
        input: 'Latest Bitcoin price and market sentiment',
        transformOutput: (output) => {
          // Extract just the relevant information from the search results
          return `Bitcoin Market Summary: ${output.result.substring(0, 300)}...`;
        }
      },
      {
        toolName: 'AnthropicTool',
        // Use the previous tool's output as input for this tool
        input: (prevResult) => `Analyze this Bitcoin market data and provide key insights: ${prevResult}`,
        transformOutput: (output) => {
          // Extract just the insights
          return output.result;
        }
      }
    ]
  });

  console.log('Executing sequential tool chain...');
  try {
    const sequentialResults = await orchestrator.executeGraph(sequentialGraph, 'test-agent');
    console.log('\nSequential Chain Results:');
    console.log(sequentialResults.get('chain-1')?.result);
  } catch (error) {
    console.error('Sequential chain execution failed:', error);
  }

  // Example 2: Parallel Execution
  console.log('\n=== EXAMPLE 2: PARALLEL EXECUTION ===');
  
  const parallelGraph = GraphBuilder.createParallelGraph([
    {
      toolName: 'WebSearchTool',
      input: 'Ethereum price today',
      id: 'eth-price'
    },
    {
      toolName: 'WebSearchTool',
      input: 'Bitcoin price today',
      id: 'btc-price'
    },
    {
      toolName: 'WebSearchTool',
      input: 'Solana price today',
      id: 'sol-price'
    }
  ], 2); // Max 2 concurrent requests

  console.log('Executing parallel tools...');
  try {
    const parallelResults = await orchestrator.executeGraph(parallelGraph, 'test-agent');
    console.log('\nParallel Execution Results:');
    console.log('ETH:', parallelResults.get('eth-price')?.result.substring(0, 100) + '...');
    console.log('BTC:', parallelResults.get('btc-price')?.result.substring(0, 100) + '...');
    console.log('SOL:', parallelResults.get('sol-price')?.result.substring(0, 100) + '...');
  } catch (error) {
    console.error('Parallel execution failed:', error);
  }

  // Example 3: Complex Workflow with Dependencies
  console.log('\n=== EXAMPLE 3: COMPLEX WORKFLOW ===');
  
  const builder = new GraphBuilder()
    // First, get market data for Bitcoin and Ethereum
    .addTool('btc-research', 'WebSearchTool', 'Bitcoin price analysis', 0)
    .addTool('eth-research', 'WebSearchTool', 'Ethereum price analysis', 0)
    
    // Then, analyze the data (depends on previous results)
    .addDependentTool(
      'market-analysis', 
      'AnthropicTool',
      (context) => {
        const btcData = context.getPreviousResult('btc-research')?.result || '';
        const ethData = context.getPreviousResult('eth-research')?.result || '';
        return `Analyze this market data and compare Bitcoin and Ethereum:\n\nBitcoin: ${btcData.substring(0, 500)}\n\nEthereum: ${ethData.substring(0, 500)}`;
      },
      ['btc-research', 'eth-research'],
      1
    )
    
    // Add a conditional follow-up question only if a certain condition is met
    .addConditionalTool(
      'follow-up-question',
      'AnthropicTool',
      (context) => {
        const analysis = context.getPreviousResult('market-analysis')?.result || '';
        return `Based on this analysis: "${analysis.substring(0, 300)}...", which cryptocurrency has better short-term outlook and why?`;
      },
      (results) => {
        // Only run this if the market analysis contains "volatility"
        const analysis = results.get('market-analysis')?.result || '';
        return analysis.toLowerCase().includes('volatility');
      },
      ['market-analysis'],
      2
    );
  
  const complexGraph = builder.build();
  
  console.log('Executing complex workflow...');
  try {
    const complexResults = await orchestrator.executeGraph(complexGraph, 'test-agent');
    console.log('\nComplex Workflow Results:');
    console.log('Market Analysis:', complexResults.get('market-analysis')?.result);
    
    if (complexResults.has('follow-up-question')) {
      console.log('\nFollow-up Question Result:');
      console.log(complexResults.get('follow-up-question')?.result);
    } else {
      console.log('\nFollow-up condition was not met, skipped.');
    }
  } catch (error) {
    console.error('Complex workflow execution failed:', error);
  }
}

// Run the test
testToolOrchestration().catch(console.error);