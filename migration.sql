-- Memory System Tables
CREATE TABLE IF NOT EXISTS memory_entries (
  id SERIAL PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX memory_entries_embedding_idx ON memory_entries 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function for similarity search
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_agent_id text,
  p_memory_type text DEFAULT NULL,
  p_start_time timestamp DEFAULT NULL,
  p_end_time timestamp DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  content text,
  type text,
  metadata jsonb,
  similarity float
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
    1 - (me.embedding <=> query_embedding) as similarity
  FROM memory_entries me
  WHERE 
    me.agent_id = p_agent_id
    AND (p_memory_type IS NULL OR me.type = p_memory_type)
    AND (p_start_time IS NULL OR me.created_at >= p_start_time)
    AND (p_end_time IS NULL OR me.created_at <= p_end_time)
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;