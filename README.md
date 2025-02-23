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

## Quick Start
Install dependencies:

Clone the repository:
```bash
git clone https://github.com/AgentisLabs/Agentis-Framework
```

Install dependencies:
```bash
npm install
```

Push schema to supabase:
```bash
npx supabase db push 
```
Alternatively you can paste the schema.sql file into the supabase sql editor and run it from there.

Run the application:
```bash
npm run chat
```

You can now interact with the agents by providing a topic for the agents to research.

By default it is a team of 4 agents and only a web search tool is available to them. You can extend the framework by adding more agents and tools.


## Architecture

- **Agent System**: Configurable agents with specialized roles
- **Memory System**: Vector-based storage with short/long-term memory
- **Tool System**: Modular and easily extensible
- **Runtime**: Manages agent lifecycle and inter-agent communication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

⚠️ Never commit API keys or sensitive data. Use environment variables.

## License

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

