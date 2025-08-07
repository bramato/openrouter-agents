import { Command } from 'commander';
import { ASCIIArt } from '../utils/ascii-art.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { AgentConfig, AgentType } from '../../types/index.js';

export const createCommand = new Command()
  .name('create')
  .description('Create a new AI agent')
  .argument('[type]', 'Agent type (mock-data, code-generator, translator, documentation, custom)')
  .option('-n, --name <name>', 'Agent name')
  .option('-m, --model <model>', 'OpenRouter model to use')
  .option('-t, --temperature <temp>', 'Temperature setting (0.0-1.0)', parseFloat)
  .option('--max-tokens <tokens>', 'Maximum tokens', parseInt)
  .option('--interactive', 'Interactive configuration mode')
  .action(async (type?: string, options: any = {}) => {
    // Show ASCII art intro
    console.log(ASCIIArt.createBanner(
      'AGENT CREATOR',
      'Create intelligent AI agents for specific tasks',
      '1.0.0'
    ));

    try {
      let agentType: AgentType;
      let agentName: string;
      let agentConfig: Partial<AgentConfig>;

      if (!type || options.interactive) {
        // Interactive mode
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'What type of agent would you like to create?',
            choices: [
              { name: '🎯 Mock Data Generator - Generate realistic test data', value: 'mock-data' },
              { name: '💻 Code Generator - Generate clean, structured code', value: 'code-generator' },
              { name: '🌐 Translator - Accurate text translation', value: 'translator' },
              { name: '📚 Documentation - Create comprehensive docs', value: 'documentation' },
              { name: '🔧 Custom Agent - Build your own specialized agent', value: 'custom' }
            ],
            default: type || 'mock-data'
          },
          {
            type: 'input',
            name: 'name',
            message: 'Enter a name for your agent:',
            default: (answers: any) => `my-${answers.type}-agent`,
            validate: (input: string) => input.length > 0 || 'Agent name is required'
          },
          {
            type: 'list',
            name: 'model',
            message: 'Choose a model:',
            choices: [
              'anthropic/claude-3.5-sonnet',
              'openai/gpt-4.1-nano',
              'anthropic/claude-3-haiku',
              'meta-llama/llama-3.1-8b-instruct:free'
            ],
            default: 'anthropic/claude-3.5-sonnet'
          },
          {
            type: 'number',
            name: 'temperature',
            message: 'Temperature (0.0-1.0, lower = more deterministic):',
            default: (answers: any) => getDefaultTemperature(answers.type),
            validate: (input: number) => (input >= 0 && input <= 1) || 'Temperature must be between 0.0 and 1.0'
          },
          {
            type: 'number',
            name: 'maxTokens',
            message: 'Maximum tokens:',
            default: 4000,
            validate: (input: number) => input > 0 || 'Max tokens must be greater than 0'
          }
        ]);

        agentType = answers.type;
        agentName = answers.name;
        agentConfig = {
          model: answers.model,
          temperature: answers.temperature,
          maxTokens: answers.maxTokens
        };
      } else {
        // Non-interactive mode
        if (!isValidAgentType(type)) {
          console.log(ASCIIArt.createError(`Invalid agent type: ${type}`));
          console.log(ASCIIArt.createInfo('Valid types: mock-data, code-generator, translator, documentation, custom'));
          process.exit(1);
        }

        agentType = type as AgentType;
        agentName = options.name || `my-${agentType}-agent`;
        agentConfig = {
          model: options.model,
          temperature: options.temperature,
          maxTokens: options.maxTokens
        };
      }

      // Create agent configuration
      const fullConfig: AgentConfig = {
        name: agentName,
        type: agentType,
        description: getDefaultDescription(agentType),
        openRouter: {
          apiKey: process.env.OPENROUTER_API_KEY || '',
          baseURL: 'https://openrouter.ai/api/v1',
          model: agentConfig.model || getDefaultModel(agentType)
        },
        temperature: agentConfig.temperature ?? getDefaultTemperature(agentType),
        maxTokens: agentConfig.maxTokens ?? getDefaultMaxTokens(agentType),
        systemPrompt: getDefaultSystemPrompt(agentType),
        features: getDefaultFeatures(agentType)
      };

      // Save configuration (this would typically save to a config file)
      console.log('\n' + ASCIIArt.createSuccess('Agent created successfully!'));
      console.log(ASCIIArt.createSection('Configuration', [
        `Name: ${chalk.cyan(fullConfig.name)}`,
        `Type: ${chalk.cyan(fullConfig.type)}`,
        `Model: ${chalk.cyan(fullConfig.openRouter.model)}`,
        `Temperature: ${chalk.cyan(fullConfig.temperature?.toString())}`,
        `Max Tokens: ${chalk.cyan(fullConfig.maxTokens?.toString())}`
      ]));

      console.log(ASCIIArt.createSection('Next Steps', [
        `Test your agent: ${chalk.yellow(`openrouter-agents test ${agentName}`)}`,
        `Chat with agent: ${chalk.yellow(`openrouter-agents chat ${agentName}`)}`,
        `List all agents: ${chalk.yellow('openrouter-agents list --agents')}`
      ]));

      // TODO: Actually save the configuration to a file
      console.log(ASCIIArt.createInfo('Note: Configuration saving not yet implemented. This is a preview.'));

    } catch (error) {
      console.log(ASCIIArt.createError(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

function isValidAgentType(type: string): type is AgentType {
  return ['mock-data', 'code-generator', 'translator', 'documentation', 'custom'].includes(type);
}

function getDefaultTemperature(type: AgentType): number {
  switch (type) {
    case 'mock-data': return 0.7;
    case 'code-generator': return 0.3;
    case 'translator': return 0.1;
    case 'documentation': return 0.4;
    case 'custom': return 0.5;
  }
}

function getDefaultMaxTokens(type: AgentType): number {
  switch (type) {
    case 'mock-data': return 4000;
    case 'code-generator': return 3000;
    case 'translator': return 1500;
    case 'documentation': return 4000;
    case 'custom': return 2000;
  }
}

function getDefaultModel(type: AgentType): string {
  switch (type) {
    case 'mock-data': return 'anthropic/claude-3.5-sonnet';
    case 'code-generator': return 'anthropic/claude-3.5-sonnet';
    case 'translator': return 'anthropic/claude-3-haiku';
    case 'documentation': return 'anthropic/claude-3.5-sonnet';
    case 'custom': return 'anthropic/claude-3.5-sonnet';
  }
}

function getDefaultDescription(type: AgentType): string {
  switch (type) {
    case 'mock-data': return 'Generates realistic mock data for testing and development';
    case 'code-generator': return 'Creates clean, well-structured code following best practices';
    case 'translator': return 'Provides accurate translations while preserving context';
    case 'documentation': return 'Creates comprehensive documentation and guides';
    case 'custom': return 'Custom agent for specialized tasks';
  }
}

function getDefaultSystemPrompt(type: AgentType): string {
  switch (type) {
    case 'mock-data':
      return 'You are a mock data generator. Generate realistic mock data based on provided schemas and examples. Return only valid JSON without markdown formatting.';
    case 'code-generator':
      return 'You are a code generator assistant. Generate clean, well-structured code following best practices. Include appropriate comments and follow existing code style.';
    case 'translator':
      return 'You are a translation assistant. Translate text accurately while preserving technical terms and context. Return only the translated text.';
    case 'documentation':
      return 'You are a documentation assistant. Create clear, comprehensive documentation that is well-structured and easy to understand.';
    case 'custom':
      return 'You are an AI assistant. Provide helpful and accurate responses based on the specific task requirements.';
  }
}

function getDefaultFeatures(type: AgentType) {
  switch (type) {
    case 'mock-data':
      return {
        jsonMode: true,
        imageGeneration: true,
        schemaValidation: true,
        batchProcessing: true
      };
    case 'code-generator':
      return {
        jsonMode: false,
        batchProcessing: true,
        sessionMemory: true
      };
    case 'translator':
      return {
        batchProcessing: true,
        sessionMemory: false
      };
    case 'documentation':
      return {
        jsonMode: false,
        batchProcessing: true,
        sessionMemory: true
      };
    case 'custom':
      return {
        jsonMode: false,
        batchProcessing: false,
        sessionMemory: false
      };
  }
}