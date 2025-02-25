// src/utils/ConsoleFormatter.ts

/**
 * Console formatting utilities for better terminal output
 */
export class ConsoleFormatter {
  // Colors
  static RESET = "\x1b[0m";
  static BRIGHT = "\x1b[1m";
  static DIM = "\x1b[2m";
  static UNDERSCORE = "\x1b[4m";
  
  // Foreground colors
  static FG_BLACK = "\x1b[30m";
  static FG_RED = "\x1b[31m";
  static FG_GREEN = "\x1b[32m";
  static FG_YELLOW = "\x1b[33m";
  static FG_BLUE = "\x1b[34m";
  static FG_MAGENTA = "\x1b[35m";
  static FG_CYAN = "\x1b[36m";
  static FG_WHITE = "\x1b[37m";
  
  // Background colors
  static BG_BLACK = "\x1b[40m";
  static BG_RED = "\x1b[41m";
  static BG_GREEN = "\x1b[42m";
  static BG_YELLOW = "\x1b[43m";
  static BG_BLUE = "\x1b[44m";
  static BG_MAGENTA = "\x1b[45m";
  static BG_CYAN = "\x1b[46m";
  static BG_WHITE = "\x1b[47m";

  /**
   * Formats a title with a box around it
   */
  static formatTitle(title: string): string {
    const line = "═".repeat(title.length + 4);
    return `\n${this.BRIGHT}${this.FG_CYAN}╔${line}╗
║  ${title}  ║
╚${line}╝${this.RESET}\n`;
  }

  /**
   * Formats an agent message
   */
  static formatAgentMessage(agentName: string, role: string, message: string): string {
    return `${this.BRIGHT}${this.FG_GREEN}┌─ ${agentName} (${role}) ───────────────────────────${this.RESET}
${this.FG_WHITE}${message}${this.RESET}
${this.BRIGHT}${this.FG_GREEN}└───────────────────────────────────────────────${this.RESET}\n`;
  }

  /**
   * Formats a user message
   */
  static formatUserMessage(message: string): string {
    return `${this.BRIGHT}${this.FG_YELLOW}┌─ USER ─────────────────────────────────────────${this.RESET}
${this.FG_WHITE}${message}${this.RESET}
${this.BRIGHT}${this.FG_YELLOW}└───────────────────────────────────────────────${this.RESET}\n`;
  }

  /**
   * Formats a status message
   */
  static formatStatus(status: string): string {
    return `${this.BRIGHT}${this.FG_MAGENTA}⋯ ${status} ⋯${this.RESET}\n`;
  }

  /**
   * Formats a task message
   */
  static formatTask(taskName: string, description: string): string {
    return `${this.BRIGHT}${this.FG_BLUE}◉ TASK: ${taskName}${this.RESET}
${this.DIM}${description}${this.RESET}\n`;
  }

  /**
   * Formats a tool execution message
   */
  static formatToolExecution(toolName: string, input: string, result: string): string {
    return `${this.BRIGHT}${this.FG_CYAN}⚙ ${toolName}${this.RESET}
${this.DIM}Input: ${input}${this.RESET}
${this.FG_WHITE}Result: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}${this.RESET}\n`;
  }

  /**
   * Formats an error message
   */
  static formatError(error: string): string {
    return `${this.BRIGHT}${this.FG_RED}✖ ERROR: ${error}${this.RESET}\n`;
  }

  /**
   * Formats a success message
   */
  static formatSuccess(message: string): string {
    return `${this.BRIGHT}${this.FG_GREEN}✓ ${message}${this.RESET}\n`;
  }

  /**
   * Formats a section separator
   */
  static formatSeparator(): string {
    return `${this.DIM}${"─".repeat(60)}${this.RESET}\n`;
  }

  /**
   * Formats a heading
   */
  static formatHeading(heading: string): string {
    return `${this.BRIGHT}${this.UNDERSCORE}${this.FG_CYAN}${heading}${this.RESET}\n`;
  }

  /**
   * Formats a list
   */
  static formatList(items: string[]): string {
    return items.map(item => `${this.FG_CYAN}• ${this.FG_WHITE}${item}${this.RESET}`).join('\n') + '\n';
  }

  /**
   * Creates a progress spinner with the given message
   */
  static createSpinner(message: string): { 
    start: () => void; 
    stop: (success?: boolean) => void;
  } {
    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let index = 0;
    let intervalId: NodeJS.Timeout | null = null;
    
    return {
      start: () => {
        if (intervalId) return;
        process.stdout.write(`${this.FG_CYAN}`);
        intervalId = setInterval(() => {
          process.stdout.write(`\r${spinnerChars[index]} ${message}`);
          index = (index + 1) % spinnerChars.length;
        }, 80);
      },
      stop: (success = true) => {
        if (!intervalId) return;
        clearInterval(intervalId);
        intervalId = null;
        process.stdout.write(`\r${success ? this.FG_GREEN + '✓' : this.FG_RED + '✖'} ${message}${this.RESET}\n`);
      }
    };
  }
  
  /**
   * Creates a progress bar
   */
  static createProgressBar(total: number, width: number = 40): { 
    update: (current: number, message?: string) => void;
    complete: (message?: string) => void;
  } {
    return {
      update: (current: number, message?: string) => {
        const percent = Math.min(Math.floor((current / total) * 100), 100);
        const filledWidth = Math.floor((width * current) / total);
        const emptyWidth = width - filledWidth;
        
        const filledBar = '█'.repeat(filledWidth);
        const emptyBar = '░'.repeat(emptyWidth);
        
        process.stdout.write(`\r${this.FG_CYAN}${filledBar}${this.DIM}${emptyBar}${this.RESET} ${percent}% ${message || ''}`);
      },
      complete: (message?: string) => {
        const filledBar = '█'.repeat(width);
        process.stdout.write(`\r${this.FG_GREEN}${filledBar}${this.RESET} 100% ${message || 'Complete!'}${this.RESET}\n`);
      }
    };
  }
}