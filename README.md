# Agentis Framework

Agentis Framework is a powerful toolkit for building autonomous AI agents with advanced capabilities like memory, planning, tool usage, task decomposition, goal-based reasoning, and pre-built platform integrations.

## Features

- **Advanced Memory System**: Agents maintain short-term and long-term memory with semantic search capabilities
- **Planning & Task Decomposition**: Break down complex tasks with planning, subtask creation, and intelligent dependency inference
- **Multi-Agent Swarms**: Create agent networks that can share information and collaborate
- **Platform Connectors**: Easily connect agents to platforms like Discord and Twitter
- **Personality & Role Management**: Control each agent's personality, role, lore, and goals
- **Multiple LLM Support**: Works with both Anthropic's Claude and OpenAI's GPT models
- **Streaming Responses**: Support for real-time streaming of responses as they're generated
- **Flexible Provider System**: Easy switching between different LLM providers
- **Multi-Provider Swarms**: Create specialized agent teams using different LLM providers working together

## Installation

```bash
npm install agentis-framework
```

## Quick Start

### Try the Example

The easiest way to explore Agentis capabilities is to run our included example - a Discord-based crypto research agent with web search and market data tools:

```bash
# Clone the repository
git clone https://github.com/agentislabs/agentis-framework.git
cd agentis-framework

# Install dependencies
npm install

# Set up environment variables (.env file)
# You'll need:
# - OPENAI_API_KEY for GPT-4 access
# - BOT_TOKEN for Discord bot authentication
# - PINECONE_API_KEY for vector memory storage
# - TAVILY_API_KEY for web search capabilities (optional)

# Run the Discord Crypto Researcher example
npm run example
```

This example demonstrates:
- Advanced memory with vector-based semantic search
- Multi-tool integration (web search, pricing data, market trends)
- Discord platform integration
- Persistent memory storage
- Specialized agent persona with expert domain knowledge
- Real-time crypto market data analysis

### Basic Usage

```typescript
import { Agent, InMemoryMemory, AgentRole } from 'agentis-framework';

// Create a simple agent
const agent = new Agent({
  name: 'Jarvis',
  role: AgentRole.ASSISTANT,
  personality: {
    traits: ['helpful', 'knowledgeable', 'friendly'],
    background: 'A sophisticated AI assistant created to help with various tasks.'
  },
  goals: ['Provide accurate information', 'Assist with problem-solving'],
});

// Set up memory
agent.setMemory(new InMemoryMemory());

// Run the agent with a task
await agent.run({
  task: "What's the weather in New York today?",
  tools: [WeatherTool],
});
```

## Advanced Usage

### Agent Swarms

```typescript
import { 
  Agent, 
  AgentSwarm, 
  InMemoryMemory, 
  PlanningStrategy, 
  DiscordConnector 
} from 'agentis-framework';

// Create specialized agents
const researchAgent = new Agent({
  name: 'Researcher',
  role: AgentRole.RESEARCHER,
  goals: ['Find accurate information'],
});

const summarizeAgent = new Agent({
  name: 'Summarizer',
  role: AgentRole.WRITER,
  goals: ['Create concise summaries'],
});

// Create a swarm
const swarm = new AgentSwarm({
  agents: [researchAgent, summarizeAgent],
  coordinator: new Agent({ name: 'Coordinator' }),
  planningStrategy: PlanningStrategy.HIERARCHICAL,
});

// Connect to Discord
const discord = new DiscordConnector({
  token: process.env.DISCORD_BOT_TOKEN,
});

discord.connect(swarm);

// The swarm is now available in your Discord server!
```

### Twitter Bot

```typescript
import { 
  Agent, 
  AgentRole, 
  TwitterDirectConnector 
} from 'agentis-framework';

// Create the agent
const agent = new Agent({
  name: 'TwitterBot',
  role: AgentRole.ASSISTANT,
  personality: {
    traits: ['helpful', 'concise', 'friendly'],
    background: 'A Twitter assistant that helps with information and engagement'
  },
  goals: ['Provide helpful information', 'Engage with users thoughtfully']
});

// Configure the Twitter connector - no API keys required!
const twitter = new TwitterDirectConnector({
  username: process.env.TWITTER_USERNAME,
  password: process.env.TWITTER_PASSWORD,
  email: process.env.TWITTER_EMAIL,
  
  // Optional Twitter API credentials for enhanced features
  apiKey: process.env.TWITTER_API_KEY,
  apiSecret: process.env.TWITTER_API_SECRET_KEY,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  
  // Monitoring options
  monitorKeywords: ['ai', 'anthropic', 'claude'],
  monitorUsers: ['AnthropicAI'],
  monitorMentions: true,
  monitorReplies: true,
  
  // Session persistence
  persistCookies: true,
  
  // Auto-reply to tweets
  autoReply: true
});

// Event handlers for different tweet types
twitter.on('tweet', async (tweet) => {
  console.log(`Received tweet from @${tweet.author.username}: ${tweet.text}`);
  await twitter.like(tweet.id);
});

twitter.on('mention', async (tweet) => {
  console.log(`Mentioned in tweet from @${tweet.author.username}`);
  const response = await agent.run({
    task: `Craft a helpful reply to this mention from @${tweet.author.username}: "${tweet.text}"`,
    context: { tweet }
  });
  await twitter.tweet(response.response, { replyTo: tweet.id });
});

twitter.on('keyword_match', async (tweet) => {
  console.log(`Keyword match in tweet from @${tweet.author.username}`);
  // Handle tweets matching monitored keywords
});

// Connect the agent to Twitter
await twitter.connect(agent);

// Get current Twitter trends
const trends = await twitter.getTrends();
console.log('Current Twitter trends:', trends.slice(0, 5));

// Post a tweet (with a poll if API keys are provided)
const tweetId = await twitter.tweet('Hello Twitter! I\'m an AI assistant powered by Agentis framework.', {
  poll: {
    options: [
      { label: 'AI & Technology 🤖' },
      { label: 'Finance & Crypto 💰' },
      { label: 'General Questions ❓' },
      { label: 'Other Topics 🌈' }
    ],
    durationMinutes: 1440 // 24 hours
  }
});

// Use Twitter's Grok AI through our connector
const grokResponse = await twitter.grokChat([{
  role: 'user',
  content: 'What are the latest AI developments?'
}]);
console.log(`Grok says: ${grokResponse.message}`);
```

### Multi-Provider Agent Swarms

```typescript
import { 
  Agent, 
  AgentRole, 
  ProviderType,
  TavilySearchTool,
  EnhancedAgentSwarm,
  AgentSpecialization
} from 'agentis-framework';

// Create a researcher agent using OpenAI with web search capability
const researcherAgent = new Agent(
  {
    name: 'Researcher',
    role: AgentRole.RESEARCHER,
    personality: {
      traits: ['thorough', 'internet-savvy'],
      background: 'A specialized researcher with web search capabilities'
    },
    goals: ['Find accurate and current information']
  },
  undefined,
  {
    type: ProviderType.OPENAI,
    model: 'gpt-4o' // Using GPT-4o for search capabilities
  }
);

// Create an analyst agent using Claude for deep reasoning
const analystAgent = new Agent(
  {
    name: 'Analyst',
    role: AgentRole.ANALYST,
    personality: {
      traits: ['analytical', 'thoughtful', 'nuanced'],
      background: 'A specialized analyst focused on deep reasoning and insight generation'
    },
    goals: ['Analyze information thoroughly', 'Generate insights']
  },
  undefined,
  {
    type: ProviderType.ANTHROPIC,
    model: 'claude-3-5-sonnet-20240620' // Using Claude for nuanced analysis
  }
);

// Define agent specializations
const agentSpecializations = {
  [researcherAgent.id]: {
    name: 'Researcher',
    description: 'Web search and information gathering specialist',
    capabilities: ['web search', 'data collection'],
    preferredTaskTypes: ['research', 'search'],
    provider: ProviderType.OPENAI
  },
  [analystAgent.id]: {
    name: 'Analyst',
    description: 'Deep reasoning and analysis specialist',
    capabilities: ['pattern recognition', 'critical thinking'],
    preferredTaskTypes: ['analysis', 'evaluation'],
    provider: ProviderType.ANTHROPIC
  }
};

// Create enhanced multi-provider swarm
const enhancedSwarm = new EnhancedAgentSwarm({
  agents: [researcherAgent, analystAgent],
  coordinator: new Agent({
    name: 'Coordinator',
    role: AgentRole.COORDINATOR
  }),
  agentSpecializations,
  planningStrategy: 'parallel'
});

// Run the enhanced swarm
const result = await enhancedSwarm.runEnhanced({
  task: 'Research and analyze the latest renewable energy developments',
  tools: [new TavilySearchTool()]
});
```

## Documentation

### Model Providers

Agentis supports multiple LLM providers:

```typescript
import { 
  Agent, 
  AgentRole, 
  ProviderType, 
  AnthropicProvider, 
  OpenAIProvider 
} from 'agentis-framework';

// Create an agent with Anthropic's Claude
const claudeAgent = new Agent({
  name: 'Claude Agent',
  role: AgentRole.ASSISTANT
}, undefined, {
  type: ProviderType.ANTHROPIC,
  model: 'claude-3-5-sonnet-20240620'
});

// Create an agent with OpenAI
const openaiAgent = new Agent({
  name: 'GPT Agent',
  role: AgentRole.ASSISTANT
}, undefined, {
  type: ProviderType.OPENAI,
  model: 'gpt-4o-mini'
});

// Alternatively, create providers directly
const anthropicProvider = new AnthropicProvider({
  model: 'claude-3-5-sonnet-20240620'
});

const openaiProvider = new OpenAIProvider({
  model: 'gpt-4o'
});

// Then use with an agent
const agent = new Agent({
  name: 'Custom Agent',
  role: AgentRole.ASSISTANT
}, anthropicProvider);
```

Agentis will automatically select a provider based on available API keys if you don't specify one.

### Streaming Responses

Agentis supports streaming responses for a more interactive experience:

```typescript
import { Agent, AgentRole } from 'agentis-framework';

// Create the agent
const agent = new Agent({
  name: 'StreamingAgent',
  role: AgentRole.ASSISTANT,
  personality: {
    traits: ['helpful', 'responsive'],
    background: 'An AI assistant that streams responses'
  }
});

// Use streaming mode
await agent.run({
  task: "Explain quantum computing in detail",
  stream: true,
  onStream: (text, done) => {
    // text contains the accumulated response so far
    // done is true when the response is complete
    process.stdout.write(text.substring(currentText.length));
    currentText = text;
    
    if (done) {
      console.log('\nResponse complete!');
    }
  }
});
```

Streaming is especially useful for:
- Long responses where you want to show progress
- Interactive applications requiring real-time feedback
- Improving perceived response time for users

### Enhanced Memory System

Agentis provides a sophisticated memory system with both short-term and long-term retention:

```typescript
import { 
  EnhancedMemory, 
  PineconeStore, 
  Agent
} from 'agentis-framework';

// Set up vector storage with Pinecone
const vectorStore = new PineconeStore({
  index: 'agentis-memory',
  dimension: 1536, // OpenAI embeddings dimension
  namespace: 'agent-namespace'
});

// Create enhanced memory with both short-term and long-term capabilities
const memory = new EnhancedMemory(vectorStore, {
  userId: 'user-123',
  namespace: 'agent-namespace',
  shortTermTTL: 24 * 60 * 60 * 1000, // 24 hours
  embeddingModel: 'text-embedding-3-small'
});

// Initialize memory
await memory.initialize();

// Create agent with enhanced memory
const agent = new Agent({
  name: 'Memory Agent',
  memory: memory
});

// Store memories
await memory.storeShortTerm({
  input: "What's your favorite color?",
  output: "I like blue!",
  timestamp: Date.now()
});

await memory.storeLongTerm({
  input: "Tell me about quantum physics",
  output: "Quantum physics studies the behavior of matter at subatomic scales...",
  timestamp: Date.now(),
  importance: 0.8
});

// Create agent notes
await memory.saveNote({
  title: "User Preferences",
  content: "User seems interested in science topics",
  tags: ["preferences", "science"],
  importance: 0.9
});

// Search memory
const results = await memory.retrieve("quantum physics");
console.log(results.longTerm); // Most relevant memories
console.log(results.notes);    // Relevant notes
```

### Advanced Task Dependency Inference

Agentis includes a sophisticated dependency inference system that automatically detects relationships between tasks:

```typescript
import { 
  DependencyInference, 
  PlanTask, 
  EnhancedPlanner 
} from 'agentis-framework';

// Tasks with no dependencies defined yet
const tasks: PlanTask[] = [
  {
    id: 'task1',
    description: 'Research current market trends for smartphone apps',
    dependencies: [],
    status: 'pending'
  },
  {
    id: 'task2',
    description: 'Analyze competitor features and pricing models',
    dependencies: [],
    status: 'pending'
  },
  {
    id: 'task3',
    description: 'Create market positioning strategy based on research',
    dependencies: [],
    status: 'pending'
  },
  {
    id: 'task4',
    description: 'Draft the market analysis report with findings',
    dependencies: [],
    status: 'pending'
  }
];

// Create inference system with options
const dependencyInference = new DependencyInference({
  enableContentSimilarity: true,
  enableTypeHierarchy: true,
  enableInformationFlow: true,
  minDependencyCertainty: 0.6,
  maxDependenciesPerTask: 3
});

// Optional natural language context that describes the plan
const planDescription = `
We need to create a market analysis report for a new smartphone app.
First, we'll research current market trends, then analyze competitors.
Using this research, we'll create a positioning strategy.
Finally, we'll draft a comprehensive report with all our findings.
`;

// Automatically infer the dependencies
const tasksWithDependencies = dependencyInference.inferDependencies(
  tasks, 
  planDescription
);

// Visualize the dependency graph
console.log(dependencyInference.visualizeDependencyGraph(tasksWithDependencies));

// Result: Tasks now have dependencies:
// - "Create market positioning strategy" depends on "Research current market trends" and "Analyze competitor features"
// - "Draft the market analysis report" depends on "Create market positioning strategy"

// The analysis uses multiple techniques:
// 1. Natural language processing of task descriptions
// 2. Knowledge flow analysis (what information each task needs/produces)
// 3. Task type hierarchy (research → analysis → writing)
// 4. Content similarity between related tasks
```

This inference system is integrated into the EnhancedPlanner and EnhancedAgentSwarm classes, so it works automatically when creating plans or coordinating multi-agent swarms.

For more detailed documentation, visit [our documentation site](#).

## Contributing

Contributions are welcome! Please read our [contributing guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.