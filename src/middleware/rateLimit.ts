import { AgentMessage } from '../agents/AgentMessage';
import { IAgent } from '../agents/IAgent';

// Simple in-memory rate limiting
const REQUESTS = new Map<string, number[]>();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export const rateLimit = async (
  message: AgentMessage,
  agent: IAgent,
  next: () => Promise<void>
) => {
  const now = Date.now();
  const key = message.sender_id;

  // Initialize or clean up old requests
  if (!REQUESTS.has(key)) {
    REQUESTS.set(key, []);
  }
  
  const requests = REQUESTS.get(key)!.filter(
    timestamp => now - timestamp < WINDOW_MS
  );
  
  if (requests.length >= MAX_REQUESTS) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  requests.push(now);
  REQUESTS.set(key, requests);

  await next();
}; 