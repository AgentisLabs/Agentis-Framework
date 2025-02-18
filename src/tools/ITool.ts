// src/tools/ITool.ts

export interface ToolInput {
    query: string;
    [key: string]: any;
  }
  
  export interface ToolOutput {
    result: any;
    [key: string]: any;
  }
  
  export interface ITool {
    name: string;
    description: string;
    execute(input: string): Promise<ToolOutput>;
  }
  