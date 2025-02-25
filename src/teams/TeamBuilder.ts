import { IAgent } from '../agents/IAgent';
import { AgentFactory } from '../agents/AgentFactory';
import { ITool } from '../tools/ITool';

export class TeamBuilder {
  private agents: Map<string, IAgent> = new Map();
  private roles: Map<string, string[]> = new Map();
  private roleTools: Map<string, ITool[]> = new Map();

  /**
   * Define a role with its capabilities
   */
  defineRole(roleName: string, capabilities: string[]): void {
    this.roles.set(roleName, capabilities);
  }

  /**
   * Associate specific tools with a role
   */
  assignToolsToRole(roleName: string, tools: ITool[]): void {
    this.roleTools.set(roleName, tools);
  }

  /**
   * Get tools assigned to a specific role
   */
  private getToolsForRole(role: string): ITool[] {
    return this.roleTools.get(role) || [];
  }

  /**
   * Create a team of agents based on the provided configuration
   */
  async createTeam(teamConfig: {
    name: string;
    roles: string[];
    domain: string;
    goals: string[];
  }): Promise<IAgent[]> {
    const team: IAgent[] = [];
    
    for (const role of teamConfig.roles) {
      const capabilities = this.roles.get(role);
      if (!capabilities) continue;
      
      const agent = await AgentFactory.createAgent({
        id: `${teamConfig.name}-${role}-${Date.now()}`,
        name: `${role}Agent`,
        lore: `Domain expert in ${teamConfig.domain} specializing in ${role}`,
        role: role,
        goals: capabilities,
        tools: this.getToolsForRole(role)
      });
      
      team.push(agent);
    }
    
    return team;
  }
} 