-- Agentis Framework Database Setup
-- Run this script in your Supabase SQL Editor or any PostgreSQL database

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables for core components

-- Agents table - stores agent configurations
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lore TEXT NOT NULL,
  role TEXT NOT NULL,
  goals JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Messages table - stores communication between agents
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Memory entries table - vector-based memory for agents
CREATE TABLE IF NOT EXISTS memory_entries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  agent_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks table - for tracking and executing tasks
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

-- Logs table - for tracking tool calls, errors, system events
CREATE TABLE IF NOT EXISTS logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  agent_id TEXT,
  log_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tools table - for registering available tools
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries

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

-- Functions for memory retrieval

-- Function for semantic similarity search
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    me.id,
    me.content,
    me.type,
    me.metadata,
    1 - (me.embedding <=> query_embedding) AS similarity
  FROM memory_entries me
  WHERE 
    me.agent_id = p_agent_id
    AND (p_memory_type IS NULL OR me.type = p_memory_type)
    AND (p_start_time IS NULL OR me.created_at >= p_start_time)
    AND (p_end_time IS NULL OR me.created_at <= p_end_time)
    AND me.embedding IS NOT NULL
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Function to get recent memory entries without embeddings
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    me.id,
    me.content,
    me.type,
    me.metadata,
    me.created_at
  FROM memory_entries me
  WHERE 
    me.agent_id = p_agent_id
    AND (p_memory_type IS NULL OR me.type = p_memory_type)
  ORDER BY me.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Create RLS policies for security (if using Supabase)
-- Uncomment and modify as needed for your security requirements

-- ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow full access to authenticated users" ON agents FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow full access to authenticated users" ON messages FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow full access to authenticated users" ON memory_entries FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow full access to authenticated users" ON tasks FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow full access to authenticated users" ON logs FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow full access to authenticated users" ON tools FOR ALL TO authenticated USING (true);

-- If you're not using Supabase, you may want to create users and roles here