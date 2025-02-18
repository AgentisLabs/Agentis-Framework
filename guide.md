Below is a full example of a TypeScript-based multi-agent framework that meets your requirements. This example includes a suggested directory structure, all the necessary TypeScript interfaces, classes, a Next.js API route, Supabase integration, and logging functionality. You can use this as a foundation and extend it further for your domain-specific needs.

Directory Structure

agent-framework/
├── package.json
├── tsconfig.json
├── schema.sql                // Supabase schema file
├── src/
│   ├── agents/
│   │   ├── IAgent.ts         // Agent interface
│   │   ├── Agent.ts          // Base Agent class
│   │   ├── AgentMessage.ts   // Agent message type
│   │   └── Task.ts           // Task type
│   ├── tools/
│   │   ├── ITool.ts          // Tool interface
│   │   ├── WebSearchTool.ts  // Example web search tool
│   │   └── LLMTool.ts        // Example LLM adapter tool
│   ├── memory/
│   │   └── MemoryClient.ts   // Memory persistence client (Supabase)
│   ├── logs/
│   │   └── Logger.ts         // Logging utility for tool calls, errors, etc.
│   └── utils/
│       └── SupabaseClient.ts // Supabase client initialization
└── pages/
    └── api/
        └── agentMessage.ts   // Next.js API route for processing messages
1. Configuration Files

package.json
Make sure to install necessary dependencies like @supabase/supabase-js, next, and typescript:

{
  "name": "agent-framework",
  "version": "1.0.0",
  "main": "build/index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build && tsc",
    "start": "next start"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0",
    "next": "^13.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^4.0.0"
  }
}
tsconfig.json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "CommonJS",
    "outDir": "./build",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src", "pages"]
}
2. Supabase Integration & Schema

src/utils/SupabaseClient.ts
This file initializes the Supabase client using environment variables (set these in your Vercel/Next.js environment):

// src/utils/SupabaseClient.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
schema.sql
Run this SQL in your Supabase instance to create the necessary tables:

-- schema.sql

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT,
  lore TEXT,
  role TEXT,
  goals JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT,
  recipient_id TEXT,
  content TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  description TEXT,
  status TEXT,
  assigned_agent_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Logs table (for tracking tool calls, errors, etc.)
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  agent_id TEXT,
  log_type TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent memory table (for long-term memory and embeddings)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS agent_memory (
  id SERIAL PRIMARY KEY,
  agent_id TEXT,
  content TEXT,
  embedding vector(1536),  -- Adjust dimensions as needed
  created_at TIMESTAMP DEFAULT NOW()
);
3. Core Framework Code

3.1 Agents
src/agents/IAgent.ts

// src/agents/IAgent.ts

import { AgentMessage } from './AgentMessage';
import { Task } from './Task';
import { ITool } from '../tools/ITool';

export interface IAgent {
  id: string;
  name: string;
  lore: string;
  role: string;
  goals: string[];
  tools: ITool[];
  shortTermMemory: any;  // Define as needed
  longTermMemory: any;   // Define as needed

  receiveMessage(message: AgentMessage): Promise<void>;
  generateTasks?(goal: string): Promise<Task[]>;
  executeTask(task: Task): Promise<void>;
  sendMessage(message: AgentMessage): Promise<void>;
}
src/agents/AgentMessage.ts

// src/agents/AgentMessage.ts

export interface AgentMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  timestamp: number;
}
src/agents/Task.ts

// src/agents/Task.ts

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assigned_agent_id?: string;
  created_at?: number;
  updated_at?: number;
}
src/agents/Agent.ts

This base class implements the agent interface and includes stub implementations for receiving messages, generating tasks, executing tasks, and sending messages—with logging integrated.

// src/agents/Agent.ts

import { IAgent } from './IAgent';
import { AgentMessage } from './AgentMessage';
import { Task } from './Task';
import { Logger, LogType } from '../logs/Logger';
import { supabase } from '../utils/SupabaseClient';

export class Agent implements IAgent {
  id: string;
  name: string;
  lore: string;
  role: string;
  goals: string[];
  tools: any[];
  shortTermMemory: any;
  longTermMemory: any;

  constructor(
    id: string,
    name: string,
    lore: string,
    role: string,
    goals: string[],
    tools: any[] = []
  ) {
    this.id = id;
    this.name = name;
    this.lore = lore;
    this.role = role;
    this.goals = goals;
    this.tools = tools;
    this.shortTermMemory = {};
    this.longTermMemory = {};
  }

  async receiveMessage(message: AgentMessage): Promise<void> {
    // Log message reception
    await Logger.log(this.id, LogType.MESSAGE, { event: 'receiveMessage', message });
    console.log(`[${this.name}] Received message:`, message.content);
    // Process the message (stub implementation)
  }

  async generateTasks(goal: string): Promise<Task[]> {
    // Stub: generate a simple task based on the goal
    const task: Task = {
      id: `${this.id}-${Date.now()}`,
      description: `Task for goal: ${goal}`,
      status: 'pending',
      assigned_agent_id: this.id,
      created_at: Date.now(),
      updated_at: Date.now()
    };

    await Logger.log(this.id, LogType.STATUS_UPDATE, { event: 'generateTasks', task });
    return [task];
  }

  async executeTask(task: Task): Promise<void> {
    // Log task execution start
    await Logger.log(this.id, LogType.STATUS_UPDATE, { event: 'executeTask-start', task });
    console.log(`[${this.name}] Executing task:`, task.description);

    // Example: Use the first available tool to execute the task
    if (this.tools.length > 0) {
      const tool = this.tools[0];
      const result = await tool.execute(task.description);
      await Logger.log(this.id, LogType.TOOL_CALL, { event: 'executeTask', tool: tool.name, result });
      console.log(`[${this.name}] Tool call result:`, result);
    }
    // Update task status to completed
    task.status = 'completed';
    task.updated_at = Date.now();
    await Logger.log(this.id, LogType.STATUS_UPDATE, { event: 'executeTask-complete', task });
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    await Logger.log(this.id, LogType.MESSAGE, { event: 'sendMessage', message });
    const { error } = await supabase.from('messages').insert([message]);
    if (error) {
      console.error("Error sending message:", error);
    }
  }
}
3.2 Tools
src/tools/ITool.ts

// src/tools/ITool.ts

export interface ToolInput {
  query: string;
  [key: string]: any;
}

export interface ToolOutput {
  result: any;
  [key: string]: any;
}

export interface ITool {
  name: string;
  description: string;
  execute(input: string): Promise<ToolOutput>;
}
src/tools/WebSearchTool.ts

An example tool that simulates a web search:

// src/tools/WebSearchTool.ts

import { ITool, ToolOutput } from './ITool';

export class WebSearchTool implements ITool {
  name = 'WebSearchTool';
  description = 'A tool to perform web searches';

  async execute(input: string): Promise<ToolOutput> {
    // Integrate with a real web search API if desired.
    return { result: `Simulated search result for query: ${input}` };
  }
}
src/tools/LLMTool.ts

An example tool that simulates an LLM call:

// src/tools/LLMTool.ts

import { ITool, ToolOutput } from './ITool';

export class LLMTool implements ITool {
  name = 'LLMTool';
  description = 'A tool to interface with an LLM via OpenRouter/Vercel AI-SDK';

  async execute(input: string): Promise<ToolOutput> {
    // Integrate with an LLM provider here.
    return { result: `Simulated LLM response for input: ${input}` };
  }
}
3.3 Memory Client
src/memory/MemoryClient.ts

This client provides methods to save and retrieve agent memory from Supabase.

// src/memory/MemoryClient.ts

import { supabase } from '../utils/SupabaseClient';

export class MemoryClient {
  static async saveMemory(agentId: string, content: string, embedding?: number[]): Promise<void> {
    const { error } = await supabase
      .from('agent_memory')
      .insert([{ agent_id: agentId, content, embedding }]);
    if (error) {
      console.error("Error saving memory:", error);
    }
  }

  static async getMemory(agentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('agent_id', agentId);
    if (error) {
      console.error("Error fetching memory:", error);
      return [];
    }
    return data || [];
  }
}
3.4 Logging
src/logs/Logger.ts

A simple logging utility that writes events to the Supabase logs table.

// src/logs/Logger.ts

import { supabase } from '../utils/SupabaseClient';

export enum LogType {
  TOOL_CALL = 'tool_call',
  ERROR = 'error',
  STATUS_UPDATE = 'status_update',
  MESSAGE = 'message'
}

export interface LogEntry {
  id?: string;
  agent_id: string;
  log_type: LogType;
  details: Record<string, any>;
  created_at?: string;
}

export class Logger {
  static async log(agentId: string, logType: LogType, details: Record<string, any>) {
    const { error } = await supabase
      .from('logs')
      .insert([{ agent_id: agentId, log_type: logType, details }]);
    if (error) {
      console.error("Failed to log:", error);
    }
  }
}
4. Next.js API Route

pages/api/agentMessage.ts
This API route receives an incoming agent message, processes it using a simulated agent (e.g., “MarketScanner”), and (if applicable) generates and executes a task.

// pages/api/agentMessage.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Agent } from '../../src/agents/Agent';
import { AgentMessage } from '../../src/agents/AgentMessage';
import { WebSearchTool } from '../../src/tools/WebSearchTool';

// For demonstration, we instantiate an agent.
// In a real-world scenario, you might fetch the agent's configuration from Supabase.
const agent = new Agent(
  'agent1',
  'MarketScanner',
  'A skilled agent specialized in scanning market data.',
  'Financial Analyst',
  ['Scan crypto market'],
  [new WebSearchTool()]
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const message: AgentMessage = req.body;
    // Process the incoming message
    await agent.receiveMessage(message);

    // If the message content suggests a scan, generate and execute a task.
    if (message.content.toLowerCase().includes('scan')) {
      const tasks = await agent.generateTasks('Scan crypto market');
      for (const task of tasks) {
        await agent.executeTask(task);
      }
    }

    res.status(200).json({ status: 'Message processed' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
5. Running the Framework

Setup Supabase:
Create a Supabase project and run the provided schema.sql to set up the tables.
Set your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables (e.g., in a .env.local file for Next.js).
Start Next.js:
Run npm install to install dependencies.
Use npm run dev to start the Next.js development server.
You can now send a POST request to /api/agentMessage with a JSON payload matching the AgentMessage interface (for example, via Postman or cURL).
Observability:
Logs are written to the logs table in Supabase.
You can build a Next.js dashboard page that reads from this table (using Supabase’s realtime subscriptions or polling) to observe the events in real time.
Final Notes

Extensibility:
Users can add new tools by implementing the ITool interface and assigning them to agents.
Planner/Orchestrator:
You can extend the Agent class or create a specialized PlannerAgent that coordinates multiple agents and tasks.
Concurrency & Serverless:
In a serverless environment, each incoming message triggers a separate invocation (as seen in the API route). For handling concurrent events safely (especially for a team of 5–10 agents), you might add additional mechanisms such as row-level locks or state checks in Supabase.
This example provides a complete, runnable skeleton of your multi-agent framework in TypeScript. Feel free to refine and expand it to fit your specific needs. Happy coding!