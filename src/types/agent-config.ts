import { ITool } from '../tools/ITool';

export type AgentConfig = {
  id: string;
  name: string;
  lore: string;
  role: string;
  goals: string[];
  tools?: ITool[];
}; 