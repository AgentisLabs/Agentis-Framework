# Agentis Framework Database Schema

The Agentis framework requires a PostgreSQL database with vector search capabilities to store agent data, messages, and memory entries. This document describes the database schema and how to set it up.

## Setup

We recommend using Supabase as it provides PostgreSQL with vector extension support out of the box, but you can use any PostgreSQL database with the `vector` extension installed.

### Using Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL editor in your Supabase dashboard
3. Run the `setup_database.sql` script from the Agentis repository

### Using PostgreSQL Directly

1. Install PostgreSQL 13 or later
2. Install the `vector` extension
3. Run the `setup_database.sql` script:

```bash
psql -U your_username -d your_database -f setup_database.sql
```

## Schema

The Agentis database consists of the following tables:

### `agents`

Stores agent configurations.

```sql
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lore TEXT NOT NULL,
  role TEXT NOT NULL,
  goals JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### `messages`

Stores communication between agents.

```sql
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### `memory_entries`

Vector-based memory storage for agents.

```sql
CREATE TABLE IF NOT EXISTS memory_entries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  agent_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### `tasks`

For tracking and executing tasks.

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_agent_id TEXT,
  parent_task_id TEXT,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### `logs`

For tracking tool calls, errors, and system events.

```sql
CREATE TABLE IF NOT EXISTS logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  agent_id TEXT,
  log_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### `tools`

For registering available tools.

```sql
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## Indexes

The setup script creates several indexes to improve query performance:

```sql
-- Vector search index
CREATE INDEX IF NOT EXISTS memory_entries_embedding_idx ON memory_entries 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for faster message retrieval
CREATE INDEX IF NOT EXISTS messages_sender_recipient_idx 
ON messages(sender_id, recipient_id);

-- Index for task status filtering
CREATE INDEX IF NOT EXISTS tasks_status_idx 
ON tasks(status);

-- Index for logs by agent
CREATE INDEX IF NOT EXISTS logs_agent_id_idx 
ON logs(agent_id);
```

## Utility Functions

### `search_memories`

Function for semantic similarity search in memory entries.

```sql
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_agent_id TEXT,
  p_memory_type TEXT DEFAULT NULL,
  p_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  type TEXT,
  metadata JSONB,
  similarity FLOAT
);
```

### `get_recent_memories`

Function to get recent memory entries without using embeddings.

```sql
CREATE OR REPLACE FUNCTION get_recent_memories(
  p_agent_id TEXT,
  p_memory_type TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
);
```

## Environment Configuration

After setting up your database, make sure to set the following environment variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Or if you're using PostgreSQL directly:

```env
DATABASE_URL=postgres://username:password@hostname:port/database
```