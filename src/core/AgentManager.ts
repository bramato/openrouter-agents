import { Agent } from './Agent.js';
import { AgentConfig, AgentType, OpenRouterConfig } from '../types/index.js';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private defaultConfig: OpenRouterConfig;

  constructor(defaultConfig: OpenRouterConfig) {
    this.defaultConfig = defaultConfig;
  }

  registerAgent(name: string, agent: Agent): void {
    this.agents.set(name, agent);
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  getAllAgents(): Map<string, Agent> {
    return new Map(this.agents);
  }

  getAgentsByType(type: AgentType): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.getType() === type);
  }

  listAgents(): { name: string; type: AgentType; description: string }[] {
    return Array.from(this.agents.entries()).map(([name, agent]) => ({
      name,
      type: agent.getType(),
      description: agent.getDescription()
    }));
  }

  createAgent(config: AgentConfig): Agent {
    // Import the specific agent class dynamically
    const AgentClass = this.getAgentClass(config.type);
    const agent = new AgentClass({
      ...config,
      openRouter: { ...this.defaultConfig, ...config.openRouter }
    });
    
    return agent;
  }

  private getAgentClass(type: AgentType): typeof Agent {
    // This would typically use dynamic imports based on type
    // For now, we'll throw an error and handle this in the specific implementations
    throw new Error(`Agent type ${type} not implemented yet. Use specific agent classes directly.`);
  }

  removeAgent(name: string): boolean {
    return this.agents.delete(name);
  }

  hasAgent(name: string): boolean {
    return this.agents.has(name);
  }

  updateAgentConfig(name: string, updates: Partial<AgentConfig>): boolean {
    const agent = this.agents.get(name);
    if (!agent) {
      return false;
    }

    agent.updateConfig(updates);
    return true;
  }

  async benchmarkAgent(name: string, testCases: any[], iterations: number = 1) {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }

    return await agent.benchmark(testCases, iterations);
  }

  async benchmarkAllAgents(testCases: any[], iterations: number = 1) {
    const results: Record<string, any> = {};
    
    for (const [name, agent] of this.agents) {
      try {
        results[name] = await agent.benchmark(testCases, iterations);
      } catch (error) {
        results[name] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }

  getAgentStats(): {
    total: number;
    byType: Record<AgentType, number>;
    names: string[];
  } {
    const byType: Record<string, number> = {};
    const names: string[] = [];

    for (const [name, agent] of this.agents) {
      names.push(name);
      const type = agent.getType();
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      total: this.agents.size,
      byType: byType as Record<AgentType, number>,
      names
    };
  }

  exportConfig(): { agents: Record<string, AgentConfig> } {
    const agentConfigs: Record<string, AgentConfig> = {};
    
    for (const [name, agent] of this.agents) {
      agentConfigs[name] = agent.getConfig();
    }

    return { agents: agentConfigs };
  }

  importConfig(config: { agents: Record<string, AgentConfig> }): void {
    this.agents.clear();
    
    for (const [name, agentConfig] of Object.entries(config.agents)) {
      try {
        const agent = this.createAgent(agentConfig);
        this.registerAgent(name, agent);
      } catch (error) {
        console.error(`Failed to import agent ${name}:`, error);
      }
    }
  }

  validateAgent(name: string): { isValid: boolean; errors: string[] } {
    const agent = this.agents.get(name);
    if (!agent) {
      return { isValid: false, errors: [`Agent ${name} not found`] };
    }

    const errors: string[] = [];
    const config = agent.getConfig();

    // Validate required config
    if (!config.openRouter.apiKey) {
      errors.push('Missing OpenRouter API key');
    }
    if (!config.openRouter.model) {
      errors.push('Missing model configuration');
    }
    if (!config.name) {
      errors.push('Missing agent name');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async healthCheck(): Promise<{
    healthy: number;
    unhealthy: number;
    details: Record<string, { healthy: boolean; error?: string }>;
  }> {
    const details: Record<string, { healthy: boolean; error?: string }> = {};
    let healthy = 0;
    let unhealthy = 0;

    for (const [name, agent] of this.agents) {
      try {
        // Try a simple test request
        const response = await agent.process({
          input: 'test',
          options: { maxTokens: 10 }
        });

        if (response.success) {
          details[name] = { healthy: true };
          healthy++;
        } else {
          details[name] = { healthy: false, error: response.error };
          unhealthy++;
        }
      } catch (error) {
        details[name] = {
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        unhealthy++;
      }
    }

    return { healthy, unhealthy, details };
  }
}