// src/agents/reasoning/StandardReasoner.ts

import { IReasoner } from './IReasoner';
import { LLMService } from '../../tools/LLMService';
import { ITool } from '../../tools/ITool';
import { Logger, LogType } from '../../logs/Logger';
import { GlobalContext } from '../../context/GlobalContext';

/**
 * Configuration options for standard reasoning
 */
export interface StandardReasonerConfig {
  systemPrompt?: string;
}

/**
 * Implements a standard reasoning approach (single-step reasoning)
 * This is the default reasoning system that produces direct responses without explicit steps
 */
export class StandardReasoner implements IReasoner {
  private llmService: LLMService;
  private tools: ITool[];
  private agentId: string;
  private agentName: string;
  private agentLore: string;
  private agentRole: string;
  private config: StandardReasonerConfig;

  constructor(
    llmService: LLMService,
    tools: ITool[],
    agentId: string,
    agentName: string,
    agentLore: string,
    agentRole: string,
    config: StandardReasonerConfig = {}
  ) {
    this.llmService = llmService;
    this.tools = tools;
    this.agentId = agentId;
    this.agentName = agentName;
    this.agentLore = agentLore;
    this.agentRole = agentRole;
    this.config = config;
  }

  /**
   * Process a user query using standard reasoning
   * @param query The user's query to process
   * @returns The response
   */
  async process(query: string): Promise<string> {
    try {
      // First, determine if we need to use any tools
      const toolPlanningPrompt = `You are ${this.agentName}, ${this.agentLore}. Your role is ${this.agentRole}.
        You have access to these tools: ${this.tools.map(t => `${t.name}: ${t.description}`).join('\n')}
        
        User message: ${query}
        
        Based on this message, should you use any tools to help answer? Respond ONLY with a JSON object in this format:
        {
          "useTool": boolean,
          "toolName": string | null,
          "reason": string
        }
        
        IMPORTANT: Respond ONLY with the JSON object, no other text.`;

      await Logger.log(this.agentId, LogType.STATUS_UPDATE, {
        event: 'standard-reasoning-planning',
        query
      });

      const planningResponse = await this.llmService.generateResponse([
        {
          role: 'system',
          content: 'You are a JSON formatting assistant. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: toolPlanningPrompt
        }
      ]);

      let plan;
      try {
        plan = JSON.parse(planningResponse.content.trim() || '{}');
      } catch (e) {
        console.error('Failed to parse planning response:', planningResponse.content);
        plan = { useTool: false, toolName: null, reason: 'Error parsing response' };
        
        await Logger.log(this.agentId, LogType.ERROR, {
          event: 'standard-reasoning-parsing-error',
          response: planningResponse.content
        });
      }

      let toolOutput = '';
      if (plan.useTool) {
        const tool = this.tools.find(t => t.name === plan.toolName);
        if (tool) {
          try {
            const result = await tool.execute(query);
            toolOutput = result.result;
            
            await Logger.log(this.agentId, LogType.TOOL_CALL, {
              event: 'standard-reasoning-tool-execution',
              tool: plan.toolName,
              result: result
            });
          } catch (error) {
            await Logger.log(this.agentId, LogType.ERROR, {
              event: 'standard-reasoning-tool-execution-error',
              tool: plan.toolName,
              error
            });
          }
        }
      }

      // Generate final response using tool output if available
      const finalPrompt = `You are ${this.agentName}, ${this.agentLore}. Your role is ${this.agentRole}.
        ${toolOutput ? `Here is relevant information I found: ${toolOutput}` : ''}
        
        Please respond to: ${query}`;

      const systemPrompt = this.config.systemPrompt || this.getDefaultSystemPrompt();

      // Use streaming for large responses that might take longer than 10 minutes
      let completionContent = '';
      const completion = await this.llmService.streamResponse(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalPrompt }
        ],
        (chunk) => {
          completionContent += chunk;
          // Optional: You could log chunks or update progress here if needed
        }
      );

      await Logger.log(this.agentId, LogType.STATUS_UPDATE, {
        event: 'standard-reasoning-complete',
        query
      });

      return completion.content;
    } catch (error) {
      await Logger.log(this.agentId, LogType.ERROR, {
        event: 'standard-reasoning-error',
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      });
      
      throw error;
    }
  }

  /**
   * Get the default system prompt for standard reasoning
   */
  private getDefaultSystemPrompt(): string {
    const context = GlobalContext.getInstance();
    
    return `You are ${this.agentName}, a highly capable AI agent with expertise in ${this.agentRole}. 
${this.agentLore}

You have access to:
- Real-time data and analysis capabilities
- Tavily web search for current information
- Long-term memory storage

${context.getTemporalContext()}

When providing information:
- Use the current date provided above when relevant
- Use Tavily web search to find current, up-to-date information
- Be direct and specific
- Make informed analyses based on available data
- Acknowledge limitations when they exist, but don't be overly cautious
- When discussing recent events, always reference them in relation to the current date`;
  }
}