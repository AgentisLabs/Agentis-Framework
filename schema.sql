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
