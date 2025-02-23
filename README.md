# Agentis Framework v0.1

## Current Architecture Overview

### Core Components

# Agentis Framework

A TypeScript framework for building sophisticated multi-agent systems with LLM integration, specializing in crypto market analysis and research.

## Features

- 🤖 Multi-agent Collaboration System
  - Agent-to-agent communication
  - Specialized agent roles (Market Research, Technical Analysis)
  - Task sharing and delegation

- 🧠 Advanced Memory Management
  - Vector-based memory storage using Supabase
  - Short-term and long-term memory systems
  - Context-aware responses

- 🛠️ Modular Tool Architecture
  - WebSearchTool with Tavily API integration
  - OpenRouterTool with Claude-3 integration
  - Extensible tool registry system

- 🔄 Real-time Market Analysis
  - Live web search capabilities
  - Market trend analysis
  - Fundamental and technical analysis

- 💾 Persistent Storage
  - Supabase integration
  - Message history tracking
  - Agent state persistence
  - Vector-based memory storage

## 🚀 Quick Start

### 1. Installation

```bash
npm install agentis
```

### 2. Environment Setup

Create a `.env` file in your project root:

```env
OPENROUTER_API_KEY=your_openrouter_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable Vector extension in your Supabase database
3. Run this SQL in your Supabase SQL editor:

```sql
-- Enable vector extension
create extension if not exists vector;

-- Create memory entries table
create table memory_entries (
  id bigint primary key generated always as identity,
  agent_id text not null,
  content text not null,
  type text not null,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create messages table
create table messages (
  id text primary key,
  sender_id text not null,
  recipient_id text not null,
  content text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now())
);
```

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

### 5. Creating a Team of Agents

```typescript
import { Agent, AgentRuntime, WebSearchTool, OpenRouterTool } from 'agentis';

// Create specialized agents
const researchAgent = new Agent(
  'research-1',
  'MarketResearcher',
  'I gather and analyze market data',
  'Researcher',
  ['Gather market information'],
  [new WebSearchTool()]
);

const strategyAgent = new Agent(
  'strategy-1',
  'StrategyMaster',
  'I create trading strategies',
  'Strategist',
  ['Create trading strategies'],
  [new OpenRouterTool()]
);

// Initialize runtime with multiple agents
const runtime = new AgentRuntime();
runtime.registerAgent(researchAgent);
runtime.registerAgent(strategyAgent);
await runtime.start();
```

## 📚 Features

- 🤖 Multi-agent System
- 🧠 Advanced Memory Management
- 🛠️ Modular Tool Architecture
- 🔄 Real-time Processing
- 💾 Persistent Storage

## 🔧 Available Tools

- `WebSearchTool`: Real-time web search capabilities
- `OpenRouterTool`: LLM integration via OpenRouter

## 📖 Documentation

For more detailed documentation, visit [our documentation site](https://docs.agentis.dev)

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md).

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details

## Roadmap

- [ ] Add more specialized market analysis tools
- [ ] Implement sophisticated inter-agent communication patterns
- [ ] Add automated trading capabilities
- [ ] Enhance memory management with better context handling
- [ ] Add monitoring and observability features


### Environment Requirements

- Supabase project with vector extension
- OpenRouter API key
- Node.js environment
- TypeScript support

## 🎯 Creating Custom Agents

Users can fully customize their agents' personalities, roles, and capabilities:

```typescript
import { Agent, WebSearchTool, OpenRouterTool } from 'agentis';

// Crypto Trading Specialist
const tradingAgent = new Agent(
  'trader-1',
  'CryptoTrader',
  'I am an experienced crypto trader specializing in technical analysis. I focus on identifying trading opportunities using multiple timeframe analysis.',
  'Trading Specialist',
  [
    'Analyze trading patterns',
    'Identify entry and exit points',
    'Monitor market sentiment'
  ],
  [new WebSearchTool(), new OpenRouterTool()]
);

// Market Research Analyst
const researchAgent = new Agent(
  'research-1',
  'MarketResearcher',
  'I specialize in fundamental analysis and market research. I analyze project fundamentals, team backgrounds, and market dynamics.',
  'Research Analyst',
  [
    'Research project fundamentals',
    'Analyze team credentials',
    'Track market developments'
  ],
  [new WebSearchTool()]
);

// News Sentiment Analyzer
const sentimentAgent = new Agent(
  'sentiment-1',
  'SentimentAnalyst',
  'I track and analyze market sentiment across social media, news, and trading platforms. I identify shifts in market psychology.',
  'Sentiment Analyst',
  [
    'Monitor social media sentiment',
    'Track news impact',
    'Analyze market psychology'
  ],
  [new WebSearchTool(), new OpenRouterTool()]
);
```

### Agent Configuration Options

Each agent can be customized with:

- **id**: Unique identifier for the agent
- **name**: Display name
- **lore**: Personality and background description that shapes the agent's responses
- **role**: Professional role that defines the agent's expertise
- **goals**: Array of specific objectives the agent works to achieve
- **tools**: Array of tools the agent can use (WebSearchTool, OpenRouterTool, etc.)
- **model** (optional): LLM model configuration
```typescript
// Optional model configuration
const agent = new Agent(
  'custom-agent',
  'CustomAgent',
  'My custom agent lore',
  'Custom Role',
  ['Goal 1', 'Goal 2'],
  [new WebSearchTool()],
  {
    provider: 'anthropic',
    name: 'anthropic/claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 4096
  }
);
```

## 🛠️ Creating Custom Tools

Agents can be enhanced with custom tools. Here's how to create your own:

### 1. Basic Tool Structure

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

### 2. Example: Creating a Price Feed Tool

```typescript
import { ITool, ToolOutput } from 'agentis';

export class PriceFeedTool implements ITool {
  name = 'PriceFeedTool';
  description = 'Fetches real-time crypto prices';

  async execute(input: string): Promise<ToolOutput> {
    const symbol = input.toUpperCase();
    const response = await fetch(`https://api.example.com/price/${symbol}`);
    const data = await response.json();
    
    return {
      result: data.price,
      metadata: {
        timestamp: Date.now(),
        symbol: symbol,
        source: 'ExampleAPI'
      }
    };
  }
}
```

### 3. Using Custom Tools

```typescript
import { Agent, PriceFeedTool } from 'agentis';

const agent = new Agent(
  'price-tracker-1',
  'PriceTracker',
  'I track and analyze crypto prices',
  'Price Analyst',
  ['Monitor price movements'],
  [new PriceFeedTool()]
);
```

### 4. Best Practices

- **Error Handling**: Always include proper error handling in your tool
- **Rate Limiting**: Implement rate limiting if calling external APIs
- **Caching**: Consider caching results for frequently used queries
- **Typing**: Use TypeScript interfaces for structured inputs/outputs
- **Documentation**: Document expected inputs and output formats

### 5. Advanced Tool Features

Tools can implement additional optional methods:

```typescript
import { ITool, ToolOutput } from 'agentis';

export class AdvancedTool implements ITool {
  name = 'AdvancedTool';
  description = 'An advanced tool example';

  // Optional initialization
  async initialize(): Promise<void> {
    // Setup code
  }

  // Main execution method
  async execute(input: string): Promise<ToolOutput> {
    return { result: 'processed data' };
  }

  // Optional cleanup
  async cleanup(): Promise<void> {
    // Cleanup code
  }

  // Optional validation
  validateInput(input: string): boolean {
    return input.length > 0;
  }
}
```

### 6. Registering Tools Globally

```typescript
import { ToolRegistry } from 'agentis';

// Register tool for all agents to use
ToolRegistry.registerTool('CustomTool', new CustomTool());

// Create agent with access to all registered tools
const agent = new Agent(
  'agent-1',
  'Agent',
  'Agent description',
  'Role',
  ['Goals'],
  ToolRegistry.getTools()
);
```

## 🤝 Team Composition

Agentis is designed for multi-agent collaboration. Agents can work together in specialized teams:

```typescript
import { Agent, AgentRuntime, WebSearchTool, OpenRouterTool } from 'agentis';

// Create a crypto research team
const researchTeam = {
  // Research Specialist
  researcher: new Agent(
    'researcher-1',
    'ResearchSpecialist',
    'I conduct deep research into crypto projects, analyzing fundamentals, tokenomics, and team backgrounds',
    'Research Analyst',
    ['Research project fundamentals', 'Analyze tokenomics'],
    [new WebSearchTool()]
  ),

  // Technical Analyst
  analyst: new Agent(
    'analyst-1',
    'TechnicalAnalyst',
    'I analyze market structures, price action, and technical indicators',
    'Technical Analyst',
    ['Analyze price trends', 'Identify technical patterns'],
    [new WebSearchTool(), new OpenRouterTool()]
  ),

  // Strategy Coordinator
  coordinator: new Agent(
    'coordinator-1',
    'StrategyMaster',
    'I coordinate research efforts and synthesize findings into actionable strategies',
    'Strategy Coordinator',
    ['Coordinate research', 'Synthesize findings'],
    [new OpenRouterTool()]
  )
};

// Initialize runtime with the team
const runtime = new AgentRuntime();
Object.values(researchTeam).forEach(agent => runtime.registerAgent(agent));
await runtime.start();

// Team can now collaborate on tasks
const response = await researchTeam.coordinator.receiveMessage({
  id: `msg-${Date.now()}`,
  sender_id: 'user',
  recipient_id: researchTeam.coordinator.id,
  content: 'Analyze Bitcoin\'s current market position',
  timestamp: Date.now()
});
```

### Team Benefits

- **Specialized Expertise**: Each agent focuses on specific aspects of analysis
- **Collaborative Intelligence**: Agents share findings and build on each other's work
- **Coordinated Research**: Strategy agents can delegate and synthesize research tasks
- **Scalable Analysis**: Teams can handle complex research tasks through division of labor

### Team Communication

Agents in a team can:
- Share research findings
- Request additional analysis
- Coordinate on complex tasks
- Synthesize collective insights

