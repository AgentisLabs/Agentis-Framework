const runtime = new AgentRuntime();
runtime.registerAgent(new Agent(testAgentConfig));
await runtime.start(); 