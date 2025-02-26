# Agentis Framework v0.3

A TypeScript framework for building sophisticated multi-agent systems with LLM integration, optimized for serverless environments and adaptable to any domain. Build custom agent teams with specialized roles, advanced reasoning systems, and powerful tool orchestration.

## Features

- 🤖 Multi-agent Collaboration System
  - Agent-to-agent communication
  - Customizable agent roles and specializations
  - Task planning, sharing, and delegation
  - Team composition for complex problem-solving

- 🧠 Advanced Memory Management
  - Vector-based memory storage using Supabase
  - Short-term and long-term memory systems
  - Context-aware knowledge retrieval
  - Temporal awareness for up-to-date responses

- 🛠️ Modular Tool Architecture
  - Flexible LLM provider system with support for Anthropic, OpenAI, and OpenRouter
  - Advanced reasoning systems including ReAct (Reasoning + Acting)
  - Streamlined API integration with customizable tools
  - Advanced tool orchestration with sequential and parallel execution
  - Composable tool pipelines with dependency management

- 🔄 Intelligent Processing
  - Live web search capabilities
  - Data-driven analysis across domains
  - Automated research workflows
  - Multi-step reasoning with reflection

- 💾 Serverless-Optimized Infrastructure
  - Supabase integration for vector and relational storage
  - Streaming response handling for long operations
  - Stateless design principles
  - High performance with low latency

## 🚀 Quick Start

### 1. Installation

```bash
npm install agentis
```

### 2. Environment Setup

Create a `.env` file in your project root:

```env
# Required for database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# LLM API keys (add the ones you plan to use)
OPENROUTER_API_KEY=your_openrouter_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable Vector extension in your Supabase database
3. Run the setup_database.sql script in your Supabase SQL editor:

```bash
# You can find this script in the repository
cat setup_database.sql | psql YOUR_DATABASE_URL
```

The script creates the following tables and functions:

- `agents` - Stores agent configurations
- `messages` - Stores communication between agents
- `memory_entries` - Vector-based memory storage
- `tasks` - For tracking and executing tasks
- `logs` - For tracking system events
- `tools` - For registering available tools

It also creates necessary indexes and vector search functions.

### 4. Basic Usage

```typescript
import { Agent, AgentRuntime, WebSearchTool, OpenRouterTool } from 'agentis';

// Create an agent
const agent = new Agent(
  'market-analyst-1',
  'MarketAnalyst',
  'I am a crypto market analyst specialized in trend analysis',
  'Market Analyst',
  ['Analyze market trends', 'Provide trading insights'],
  [new WebSearchTool(), new OpenRouterTool()]
);

// Initialize runtime
const runtime = new AgentRuntime();
runtime.registerAgent(agent);
await runtime.start();

// Send a message to the agent
const response = await agent.receiveMessage({
  id: `msg-${Date.now()}`,
  sender_id: 'user',
  recipient_id: agent.id,
  content: 'Analyze the current BTC market trends',
  timestamp: Date.now()
});

console.log(response.content);
```

## 🔧 Available Tools & Providers

### LLM Providers

Agentis now supports multiple LLM providers that can be configured on a per-agent basis:

```typescript
// Example of creating agents with different LLM providers
const anthropicAgent = new Agent(
  'anthropic-agent',
  'AnthropicAgent',
  'I use Claude for precise analysis',
  'Analysis Expert',
  ['Analyze data', 'Provide insights'],
  [new WebSearchTool()],
  {
    provider: 'anthropic',
    name: 'claude-3-7-sonnet-20250219',
    temperature: 0.5,
    maxTokens: 4096
  }
);

const openaiAgent = new Agent(
  'openai-agent',
  'GPTAgent',
  'I use GPT models for creative content',
  'Creative Writer',
  ['Generate content', 'Write copy'],
  [new WebSearchTool()],
  {
    provider: 'openai',
    name: 'gpt-4o',
    temperature: 0.8,
    maxTokens: 2048
  }
);

const openRouterAgent = new Agent(
  'openrouter-agent',
  'FlexAgent',
  'I can access multiple models through OpenRouter',
  'Flexible Assistant',
  ['Answer questions', 'Perform tasks'],
  [new WebSearchTool()],
  {
    provider: 'openrouter',
    name: 'anthropic/claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 4096
  }
);
```

You can even provide separate API keys for each agent if needed:

```typescript
const customKeyAgent = new Agent(
  'custom-key-agent',
  'CustomAgent',
  'I use a specific API key',
  'Specialized Agent',
  ['Custom tasks'],
  [new WebSearchTool()],
  {
    provider: 'anthropic',
    name: 'claude-3-7-sonnet-20250219',
    apiKey: 'your-specific-api-key'
  }
);
```

### Available Tools

- `WebSearchTool`: Real-time web search capabilities
- `AnthropicTool`: Direct access to Claude models
- `OpenRouterTool`: Access to various LLMs via OpenRouter
- `TechnicalAnalysisTool`: Data analysis with multiple indicators
- `CoinGeckoTool`: Cryptocurrency market data integration
- `BirdeyeTool`: Token metrics and analytics
- `OnChainAnalysisTool`: Blockchain data analysis

## 📚 Advanced Reasoning Systems

Agentis now supports different reasoning systems for agents, allowing you to choose the best approach for each task:

### ReAct Reasoning

ReAct (Reasoning + Acting) combines step-by-step reasoning with tool use, enabling more sophisticated problem-solving:

```typescript
// Create an agent with ReAct reasoning
const reactAgent = new Agent(
  'react-agent',
  'ReActAgent',
  'I am a thoughtful agent who reasons step-by-step',
  'Reasoning Specialist',
  ['Break down problems', 'Use tools effectively'],
  [new WebSearchTool(), new AnthropicTool()],
  {
    provider: 'anthropic',
    name: 'claude-3-7-sonnet-20250219',
    temperature: 0.7
  },
  {
    type: 'react',         // Enable ReAct reasoning
    maxIterations: 5,      // Max reasoning steps (default: 5)
    verbose: true,         // Log reasoning steps (default: false)
    systemPrompt: 'Optional custom system prompt'
  }
);
```

Benefits of ReAct reasoning:
- Better handling of complex, multi-step problems
- Transparent reasoning process showing each step
- More effective tool use through explicit planning
- Improved ability to catch and correct errors mid-reasoning

### Standard Reasoning

For simpler tasks or when speed is a priority, standard reasoning provides direct responses:

```typescript
// Create an agent with standard reasoning (default)
const standardAgent = new Agent(
  'standard-agent',
  'StandardAgent',
  'I provide direct, concise answers',
  'General Assistant',
  ['Answer questions', 'Provide information'],
  [new WebSearchTool()],
  { provider: 'anthropic', name: 'claude-3-7-sonnet-20250219' },
  { 
    type: 'standard',
    systemPrompt: 'Optional custom system prompt'
  }
);
```

## 📚 Creating Multi-Agent Research Teams

Agentis excels at creating specialized agent teams that can collaborate on complex tasks:

```typescript
// Create a research team with specialized roles
const researchTeam = {
  // Coordinator using Anthropic's Claude with ReAct reasoning
  coordinator: new Agent(
    'research-coordinator',
    'ResearchCoordinator',
    'I plan research and synthesize findings',
    'Research Coordinator',
    ['Plan research', 'Synthesize findings'],
    [new AnthropicTool()],
    { provider: 'anthropic', name: 'claude-3-7-sonnet-20250219' },
    { type: 'react', maxIterations: 5 }  // Use ReAct for complex planning
  ),
  
  // Web researcher using OpenAI with standard reasoning
  webResearcher: new Agent(
    'web-researcher',
    'WebResearcher',
    'I gather information from online sources',
    'Web Research Specialist',
    ['Find information', 'Verify facts'],
    [new WebSearchTool()],
    { provider: 'openai', name: 'gpt-4o' },
    { type: 'standard' }  // Use standard reasoning for simpler tasks
  ),
  
  // Analyst using OpenRouter with ReAct reasoning
  analyst: new Agent(
    'analyst',
    'DataAnalyst',
    'I analyze findings and identify patterns',
    'Analysis Specialist',
    ['Analyze data', 'Identify patterns'],
    [new AnthropicTool()],
    { provider: 'openrouter', name: 'anthropic/claude-3-opus-20240229' },
    { type: 'react', verbose: true }  // Use ReAct with logging
  )
};

// Initialize runtime with the team
const runtime = new AgentRuntime();
Object.values(researchTeam).forEach(agent => runtime.registerAgent(agent));
await runtime.start();
```

## 🛠️ Creating Custom Tools

Agents can be enhanced with custom tools. Here's how to create your own:

```typescript
import { ITool, ToolOutput } from 'agentis';

export class CustomTool implements ITool {
  name = 'CustomTool';
  description = 'Description of what your tool does';

  async execute(input: string): Promise<ToolOutput> {
    // Your tool's logic here
    return {
      result: `Processed: ${input}`
    };
  }
}
```

### Tool Orchestration

Agentis provides a sophisticated tool orchestration system for complex tool execution flows:

```typescript
import { EnhancedToolOrchestrator, GraphBuilder } from 'agentis/tools';

// Create tool orchestrator
const orchestrator = new EnhancedToolOrchestrator({
  defaultTools: [myTool1, myTool2, myTool3]
});

// Build a parallel execution graph
const graph = new GraphBuilder()
  .addTool('search-1', 'WebSearchTool', 'bitcoin price', 0)
  .addTool('search-2', 'WebSearchTool', 'ethereum price', 0)
  // Process results of both searches
  .addDependentTool(
    'analysis',
    'AnthropicTool',
    (context) => {
      const btcData = context.getPreviousResult('search-1')?.result || '';
      const ethData = context.getPreviousResult('search-2')?.result || '';
      return `Compare these prices: BTC: ${btcData}, ETH: ${ethData}`;
    },
    ['search-1', 'search-2'], // dependencies
    1 // priority
  )
  .parallel(2) // max 2 concurrent requests
  .build();

// Execute the graph
const results = await orchestrator.executeGraph(graph, 'my-agent-id');
console.log(results.get('analysis')?.result);
```

## 📖 Documentation

For more detailed documentation, visit [our documentation site](https://docs.agentis.dev)

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md).

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details

## Roadmap

- [x] Add sophisticated tool orchestration system with parallel execution
- [x] Add flexible LLM provider system (Anthropic, OpenAI, OpenRouter)
- [x] Implement ReAct reasoning for enhanced agent capabilities
- [x] Optimize for serverless environments with streaming responses
- [ ] Implement advanced agent team coordination patterns
- [ ] Add more specialized domain-specific tools
- [ ] Enhance memory management with hierarchical storage
- [ ] Add monitoring and observability features
- [ ] Implement agent reflection and self-improvement mechanisms

## Environment Requirements

- Supabase project with vector extension
- Node.js environment
- TypeScript support
- API keys for LLM providers you plan to use