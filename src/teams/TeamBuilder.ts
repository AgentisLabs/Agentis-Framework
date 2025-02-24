export class TeamBuilder {
  private agents: Map<string, IAgent> = new Map();
  private roles: Map<string, string[]> = new Map();

  defineRole(roleName: string, capabilities: string[]) {
    this.roles.set(roleName, capabilities);
  }

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