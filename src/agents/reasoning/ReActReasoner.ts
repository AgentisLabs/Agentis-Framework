// src/agents/reasoning/ReActReasoner.ts

import { ILLMProvider, LLMMessage } from '../../tools/providers/ILLMProvider';
import { ITool, ToolOutput } from '../../tools/ITool';
import { LLMService } from '../../tools/LLMService';
import { Logger, LogType } from '../../logs/Logger';
import { GlobalContext } from '../../context/GlobalContext';

/**
 * Represents a step in the ReAct reasoning process
 */
export interface ReActStep {
  thought: string;
  action?: {
    tool: string;
    input: string;
  };
  observation?: string;
  finalAnswer?: string;
}

/**
 * Configuration options for ReAct reasoning
 */
export interface ReActConfig {
  maxIterations?: number;
  verbose?: boolean;
  systemPrompt?: string;
}

/**
 * Implements the ReAct (Reasoning + Acting) approach for agent reasoning
 * This approach interleaves reasoning steps with tool use for more sophisticated problem-solving
 */
export class ReActReasoner {
  private llmService: LLMService;
  private tools: ITool[];
  private agentId: string;
  private agentName: string;
  private agentLore: string;
  private agentRole: string;
  private config: ReActConfig;

  constructor(
    llmService: LLMService,
    tools: ITool[],
    agentId: string,
    agentName: string,
    agentLore: string,
    agentRole: string,
    config: ReActConfig = {}
  ) {
    this.llmService = llmService;
    this.tools = tools;
    this.agentId = agentId;
    this.agentName = agentName;
    this.agentLore = agentLore;
    this.agentRole = agentRole;
    this.config = {
      maxIterations: 5,
      verbose: false,
      ...config
    };
  }

  /**
   * Process a user query using ReAct reasoning
   * @param query The user's query to process
   * @returns The final response after reasoning
   */
  async process(query: string): Promise<string> {
    const steps: ReActStep[] = [];
    let finalAnswer = '';
    let iteration = 0;
    
    // Initialize the ReAct prompt with system instructions
    const systemPrompt = this.config.systemPrompt || this.getDefaultSystemPrompt();
    
    try {
      // Main ReAct loop - think, act, observe, repeat until conclusion or max iterations
      while (iteration < (this.config.maxIterations || 5)) {
        // Create the full prompt with context, tools info, and prior steps
        const fullPrompt = this.createReActPrompt(query, steps);
        
        // Get the next reasoning step from the LLM using streaming
        let completionContent = '';
        const response = await this.llmService.streamResponse(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: fullPrompt }
          ],
          (chunk) => {
            completionContent += chunk;
            // Optional: We could print streaming chunks in verbose mode
          }
        );
        
        // Parse the response to extract thought, action, etc.
        const step = this.parseResponse(response.content);
        
        if (this.config.verbose) {
          console.log(`\n[ReAct Step ${iteration + 1}]:`);
          console.log(`Thought: ${step.thought}`);
          if (step.action) console.log(`Action: ${step.action.tool}(${step.action.input})`);
          if (step.finalAnswer) console.log(`Final Answer: ${step.finalAnswer}`);
        }
        
        // Log the reasoning step
        await Logger.log(this.agentId, LogType.STATUS_UPDATE, {
          event: 'react-reasoning-step',
          iteration,
          thought: step.thought,
          action: step.action,
          finalAnswer: step.finalAnswer
        });
        
        // If the agent has determined a final answer, we're done
        if (step.finalAnswer) {
          finalAnswer = step.finalAnswer;
          steps.push(step);
          break;
        }
        
        // If the agent wants to use a tool, execute it and add the observation
        if (step.action) {
          const tool = this.tools.find(t => t.name.toLowerCase() === step.action?.tool.toLowerCase());
          
          if (tool) {
            try {
              const result = await tool.execute(step.action.input);
              step.observation = result.result || 'No result returned from tool';
              
              if (this.config.verbose && step.observation) {
                console.log(`Observation: ${step.observation.substring(0, 100)}${step.observation.length > 100 ? '...' : ''}`);
              }
              
              await Logger.log(this.agentId, LogType.TOOL_CALL, {
                event: 'react-tool-execution',
                tool: step.action.tool,
                input: step.action.input,
                result: result
              });
            } catch (error) {
              step.observation = `Error executing tool ${step.action.tool}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              
              await Logger.log(this.agentId, LogType.ERROR, {
                event: 'react-tool-execution-error',
                tool: step.action.tool,
                input: step.action.input,
                error
              });
            }
          } else {
            step.observation = `Tool '${step.action.tool}' not found. Available tools: ${this.tools.map(t => t.name).join(', ')}`;
          }
        }
        
        steps.push(step);
        iteration++;
      }
      
      // If we reached max iterations without a final answer, synthesize one
      if (!finalAnswer) {
        finalAnswer = await this.synthesizeFinalAnswer(query, steps);
      }
      
      return finalAnswer;
      
    } catch (error) {
      await Logger.log(this.agentId, LogType.ERROR, {
        event: 'react-reasoning-error',
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      });
      
      throw error;
    }
  }
  
  /**
   * Creates the ReAct prompt incorporating the context and previous steps
   */
  private createReActPrompt(query: string, steps: ReActStep[]): string {
    // Start with user query and tools information
    let prompt = `Question: ${query}\n\n`;
    
    prompt += "Available Tools:\n";
    this.tools.forEach(tool => {
      prompt += `- ${tool.name}: ${tool.description}\n`;
    });
    
    // Add previous reasoning steps
    if (steps.length > 0) {
      prompt += "\nPrevious Steps:\n";
      
      steps.forEach((step, index) => {
        prompt += `\nStep ${index + 1}:\n`;
        prompt += `Thought: ${step.thought}\n`;
        
        if (step.action) {
          prompt += `Action: ${step.action.tool}(${step.action.input})\n`;
        }
        
        if (step.observation) {
          prompt += `Observation: ${step.observation}\n`;
        }
      });
    }
    
    // Add instruction for the next step
    prompt += "\nNow, continue the reasoning process with the next step. Use the following format:\n";
    prompt += "Thought: <your reasoning about what to do next>\n";
    prompt += "Action: <tool_name>(<tool_input>) OR 'Final Answer: <your final answer to the original question>'\n";
    
    return prompt;
  }
  
  /**
   * Parse the LLM response to extract thought, action, and final answer
   */
  private parseResponse(response: string): ReActStep {
    const step: ReActStep = {
      thought: ''
    };
    
    // Extract thought
    const thoughtMatch = response.match(/Thought:\s*(.*?)(?=\nAction:|Final Answer:|$)/s);
    if (thoughtMatch && thoughtMatch[1]) {
      step.thought = thoughtMatch[1].trim();
    }
    
    // Extract final answer if present (capture everything after "Final Answer:")
    if (response.includes("Final Answer:")) {
      const finalAnswerParts = response.split("Final Answer:");
      if (finalAnswerParts.length > 1) {
        step.finalAnswer = finalAnswerParts[1].trim();
        return step;
      }
    }
    
    // Extract action if present
    const actionMatch = response.match(/Action:\s*([a-zA-Z0-9_]+)\(([^)]*)\)/);
    if (actionMatch && actionMatch[1] && actionMatch[2]) {
      step.action = {
        tool: actionMatch[1].trim(),
        input: actionMatch[2].trim()
      };
    }
    
    return step;
  }
  
  /**
   * If max iterations is reached without a final answer, synthesize one
   */
  private async synthesizeFinalAnswer(query: string, steps: ReActStep[]): Promise<string> {
    const systemPrompt = `You are ${this.agentName}, a thoughtful AI assistant. Your role is to synthesize information and provide a final answer.`;
    
    let prompt = `I need you to synthesize the following reasoning steps into a final answer to the original question.\n\n`;
    prompt += `Original Question: ${query}\n\n`;
    prompt += `Reasoning Steps:\n`;
    
    steps.forEach((step, index) => {
      prompt += `\nStep ${index + 1}:\n`;
      prompt += `Thought: ${step.thought}\n`;
      
      if (step.action) {
        prompt += `Action: ${step.action.tool}(${step.action.input})\n`;
      }
      
      if (step.observation) {
        prompt += `Observation: ${step.observation}\n`;
      }
    });
    
    prompt += `\nBased on these steps, provide a clear and concise final answer to the original question.`;
    
    // Use streaming for potentially long responses
    let completionContent = '';
    const response = await this.llmService.streamResponse(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      (chunk) => {
        completionContent += chunk;
      }
    );
    
    return response.content;
  }
  
  /**
   * Get the default system prompt for ReAct reasoning
   */
  private getDefaultSystemPrompt(): string {
    const context = GlobalContext.getInstance();
    
    return `You are ${this.agentName}, an AI assistant with the ability to reason through complex problems step by step.
    
${this.agentLore}

Your role is ${this.agentRole}.

${context.getTemporalContext()}

You have access to various tools to help answer questions. For each step:
1. Think about what you know and what you need to find out
2. Decide on the next action - either using a tool or providing a final answer
3. If you need more information, use a relevant tool
4. When you have enough information, provide a Final Answer

IMPORTANT INSTRUCTIONS:
- Always be aware of the current date provided above
- When researching time-sensitive information, consider how recent the data is
- For each reasoning step, start with "Thought:" followed by your reasoning
- When you need to use a tool, use the format "Action: tool_name(tool_input)"
- When you have enough information to answer the question, use "Final Answer: your answer here"
- Be thorough but efficient in your reasoning
- Use tools when you need specific information
- Your final answer should address the original question completely and be up-to-date

Remember that you're reasoning step by step. Each step should make progress toward answering the question.`;
  }
}