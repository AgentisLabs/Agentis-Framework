import { AgentMessage } from '../agents/AgentMessage';
import { IAgent } from '../agents/IAgent';

export type MiddlewareFunction = (
  message: AgentMessage,
  agent: IAgent,
  next: () => Promise<void>
) => Promise<void>;

export class MiddlewareChain {
  private middlewares: MiddlewareFunction[] = [];

  use(middleware: MiddlewareFunction): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(message: AgentMessage, agent: IAgent): Promise<void> {
    const run = async (index: number): Promise<void> => {
      if (index < this.middlewares.length) {
        await this.middlewares[index](message, agent, () => run(index + 1));
      }
    };
    await run(0);
  }
} 