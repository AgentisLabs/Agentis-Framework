// examples/provider-specific-agents.ts

import { Agent, AgentRuntime, WebSearchTool, LLMService } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * This example demonstrates how to create agents with different LLM providers
 * Each agent can use a different provider based on its specific needs
 */
async function main() {
  // Create an Anthropic-powered agent
  const claudeAgent = new Agent(
    'claude-agent',
    'ClaudeAgent',
    'I am an analytical agent specializing in detailed research and analysis',
    'Research Specialist',
    ['Provide detailed research', 'Answer complex questions'],
    [new WebSearchTool()],
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.5,
      maxTokens: 4096,
      // Optional: provide a specific API key for this agent
      // apiKey: process.env.SPECIFIC_ANTHROPIC_API_KEY 
    }
  );

  // Create an OpenAI-powered agent
  const gptAgent = new Agent(
    'gpt-agent',
    'GPTAgent',
    'I am a creative agent specialized in generating ideas and creative content',
    'Creative Specialist',
    ['Generate creative ideas', 'Draft engaging content'],
    [new WebSearchTool()],
    {
      provider: 'openai',
      name: 'gpt-4o',
      temperature: 0.8,
      maxTokens: 2048
    }
  );

  // Create an OpenRouter-powered agent that can access multiple models
  const openRouterAgent = new Agent(
    'openrouter-agent',
    'OpenRouterAgent',
    'I am a flexible agent with access to multiple models via OpenRouter',
    'Flexible Assistant',
    ['Provide general assistance', 'Answer various questions'],
    [new WebSearchTool()],
    {
      provider: 'openrouter',
      name: 'anthropic/claude-3-opus-20240229',
      temperature: 0.7,
      maxTokens: 4096
    }
  );

  // Initialize runtime and register agents
  const runtime = new AgentRuntime();
  await runtime.registerAgent(claudeAgent);
  await runtime.registerAgent(gptAgent);
  await runtime.registerAgent(openRouterAgent);
  
  console.log('Initialized agents with different LLM providers:');
  console.log(`- ${claudeAgent.name} using Anthropic Claude`);
  console.log(`- ${gptAgent.name} using OpenAI GPT-4o`);
  console.log(`- ${openRouterAgent.name} using OpenRouter with Claude Opus`);

  // Send a test message to each agent
  const testQuery = 'What are three emerging trends in quantum computing?';
  
  console.log('\n--- Claude Agent Response ---');
  const claudeResponse = await claudeAgent.receiveMessage({
    id: `msg-${Date.now()}-claude`,
    sender_id: 'user',
    recipient_id: claudeAgent.id,
    content: testQuery,
    timestamp: Date.now()
  });
  console.log(claudeResponse.content);

  console.log('\n--- GPT Agent Response ---');
  const gptResponse = await gptAgent.receiveMessage({
    id: `msg-${Date.now()}-gpt`,
    sender_id: 'user',
    recipient_id: gptAgent.id,
    content: testQuery,
    timestamp: Date.now()
  });
  console.log(gptResponse.content);

  console.log('\n--- OpenRouter Agent Response ---');
  const openRouterResponse = await openRouterAgent.receiveMessage({
    id: `msg-${Date.now()}-openrouter`,
    sender_id: 'user',
    recipient_id: openRouterAgent.id,
    content: testQuery,
    timestamp: Date.now()
  });
  console.log(openRouterResponse.content);
}

// Run the example
main().catch(console.error);