import { Task } from '../agents/Task';
import { IAgent } from '../agents/IAgent';

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
    const results: any[] = [];
    const executionMetadata: Array<{
      agentId: string;
      status: string;
      duration: number;
    }> = [];

    // Group agents by execution stage
    agents.forEach(agent => {
      // Default to stage 0 if determineStage not implemented
      const stage = this.determineStage ? this.determineStage(agent, task) : 0;
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
            .then((result: any) => {
              const metadata = {
                agentId: agent.id,
                status: 'success',
                duration: Date.now() - stageStart
              };
              executionMetadata.push(metadata);
              return {
                agentId: agent.id,
                status: 'success',
                result
              };
            })
            .catch((error: any) => {
              const metadata = {
                agentId: agent.id,
                status: 'failed',
                duration: Date.now() - stageStart
              };
              executionMetadata.push(metadata);
              return {
                agentId: agent.id,
                status: 'failed',
                error
              };
            })
        )
      );

      results.push(...stageResults);
    }

    return { results, metadata: executionMetadata };
  }

  private determineStage(agent: IAgent, task: Task): number {
    // Default implementation: all agents execute in parallel (stage 0)
    return 0;
  }
} 