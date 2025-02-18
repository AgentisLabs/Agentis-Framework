export type AgentConfig = {
  id: string;
  name: string;
  lore: string;
  role: string;
  goals: string[];
  tools?: any[];
  // Remove crypto-specific config, let users add their own in JSON
}; 