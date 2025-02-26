// src/context/GlobalContext.ts

/**
 * Provides global context information that can be used by agents
 * This includes temporal context (current date/time), location information,
 * and other global state that agents should be aware of
 */
export class GlobalContext {
  private static instance: GlobalContext;
  
  private _currentDate: Date;
  private _timeZone: string;
  private _customContext: Record<string, any> = {};

  private constructor() {
    this._currentDate = new Date();
    this._timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Get the singleton instance of GlobalContext
   */
  public static getInstance(): GlobalContext {
    if (!GlobalContext.instance) {
      GlobalContext.instance = new GlobalContext();
    }
    return GlobalContext.instance;
  }

  /**
   * Get the current date
   */
  public get currentDate(): Date {
    // Always return the current date when accessed
    this._currentDate = new Date();
    return this._currentDate;
  }

  /**
   * Set a specific date for testing or simulation purposes
   */
  public setDate(date: Date): void {
    this._currentDate = date;
  }

  /**
   * Get the current timezone
   */
  public get timeZone(): string {
    return this._timeZone;
  }

  /**
   * Set a specific timezone
   */
  public setTimeZone(timeZone: string): void {
    this._timeZone = timeZone;
  }

  /**
   * Set custom context value
   */
  public setCustomContext(key: string, value: any): void {
    this._customContext[key] = value;
  }

  /**
   * Get custom context value
   */
  public getCustomContext(key: string): any {
    return this._customContext[key];
  }

  /**
   * Get all custom context values
   */
  public getAllCustomContext(): Record<string, any> {
    return { ...this._customContext };
  }

  /**
   * Get a formatted string with the current date in ISO format
   */
  public getFormattedDate(): string {
    return this.currentDate.toISOString().split('T')[0];
  }

  /**
   * Get a human-readable date string
   */
  public getHumanReadableDate(): string {
    return this.currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: this._timeZone
    });
  }

  /**
   * Generate a complete temporal context string for agent prompts
   */
  public getTemporalContext(): string {
    const date = this.currentDate;
    
    return `Current date: ${this.getHumanReadableDate()} (${this.getFormattedDate()})
Current time: ${date.toLocaleTimeString('en-US', { timeZone: this._timeZone })}
Time zone: ${this._timeZone}
Year: ${date.getFullYear()}
Month: ${date.toLocaleString('en-US', { month: 'long' })} (${date.getMonth() + 1})
Day of week: ${date.toLocaleString('en-US', { weekday: 'long' })}`;
  }

  /**
   * Get a compact version of the temporal context
   */
  public getCompactTemporalContext(): string {
    return `Current date: ${this.getFormattedDate()} (${this.currentDate.toLocaleString('en-US', { weekday: 'short' })})`;
  }

  /**
   * Reset all custom context values
   */
  public resetCustomContext(): void {
    this._customContext = {};
  }
}