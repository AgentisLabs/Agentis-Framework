# Agentis Framework

## Current Architecture Overview

### Core Components

1. **Agent System**
   - Base Agent class with configurable properties (```typescript:src/agents/Agent.ts startLine: 13 endLine: 46```)
   - Supports multiple tools, memory management, and middleware
   - Implements message handling and task execution
   - Currently uses OpenRouter for LLM interactions

2. **Memory System**
   - Vector-based memory storage using Supabase
   - Supports both short-term and long-term memory
   - Capable of similarity search (```typescript:src/memory/VectorMemoryClient.ts startLine: 37 endLine: 52```)
   - 1536-dimensional vector storage for embeddings

3. **Tool System**
   - Modular tool architecture
   - Currently implemented tools:
     - OpenRouterTool (Claude-3 integration)
     - WebSearchTool (stub implementation)
   - Tool Registry for managing tool collections

4. **Database Schema**
   - Agents table: Stores agent configurations and metadata
   - Messages table: Inter-agent communication history
   - Tasks table: Task tracking and management
   - Logs table: System-wide logging
   - Agent_memory table: Vector-based memory storage

### Current Capabilities

1. **Agent Operations**
   - Message receiving and sending
   - Basic task generation and execution
   - Memory persistence
   - Tool execution
   - Logging of operations

2. **Configuration**
   - Supports configuration-based agent creation (```typescript:src/config/test-agent.ts startLine: 5 endLine: 19```)
   - Factory pattern for agent instantiation
   - Environment-based configuration

3. **Database Operations**
   - CRUD operations for agents
   - Message storage
   - Vector-based memory storage
   - Operational logging

### Limitations

1. **Tool Orchestration**
   - Limited to sequential tool execution
   - No complex tool chaining
   - No parallel tool execution

2. **Memory Management**
   - Basic vector storage
   - No automatic memory cleanup
   - Limited context window management

3. **Agent Collaboration**
   - Basic message passing
   - No sophisticated multi-agent coordination
   - No task sharing or delegation

### Environment Requirements

- Supabase project with vector extension
- OpenRouter API key
- Node.js environment
- TypeScript support

### Configuration Requirements


## Next Steps

1. Implement the Tool Orchestrator for better tool management
2. Add the Runtime environment for agent lifecycle management
3. Enhance memory management with better context handling
4. Implement sophisticated inter-agent communication
5. Add monitoring and observability features

Would you like me to elaborate on any of these aspects or provide implementation details for the next steps?
