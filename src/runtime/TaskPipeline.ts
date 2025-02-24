export class TaskPipeline {
  async executePipeline(task: Task, agents: IAgent[]): Promise<{
    results: any[];
    metadata: {
      agentId: string;
      status: string;
      duration: number;
    }[];
  }> {
    const pipeline = new Map<number, IAgent[]>();
    const results = [];
    const metadata = [];

    // Group agents by execution stage
    agents.forEach(agent => {
      const stage = this.determineStage(agent, task);
      if (!pipeline.has(stage)) {
        pipeline.set(stage, []);
      }
      pipeline.get(stage)!.push(agent);
    });

    // Execute stages sequentially
    for (const [stage, stageAgents] of pipeline) {
      const stageStart = Date.now();
      
      // Execute agents in parallel within each stage
      const stageResults = await Promise.all(
        stageAgents.map(agent => 
          agent.executeTask(task)
            .then(result => ({
              agentId: agent.id,
              status: 'success',
              result
            }))
            .catch(error => ({
              agentId: agent.id,
              status: 'failed',
              error
            }))
        )
      );

      results.push(...stageResults);
      metadata.push({
        stage,
        duration: Date.now() - stageStart,
        agents: stageAgents.map(a => a.id)
      });
    }

    return { results, metadata };
  }
} 