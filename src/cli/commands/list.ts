import { Command } from 'commander';
import { ASCIIArt } from '../utils/ascii-art.js';
import chalk from 'chalk';
import { OpenRouterAPI } from '../../core/OpenRouterAPI.js';

export const listCommand = new Command()
  .name('list')
  .description('List available agents and models')
  .option('--agents', 'List configured agents')
  .option('--models', 'List available OpenRouter models')
  .option('--json-only', 'Show only JSON-capable models')
  .option('--image-gen', 'Show only image generation models')
  .option('--categories', 'Group models by category')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(async (options: any = {}) => {
    // Show ASCII art intro
    console.log(ASCIIArt.createBanner(
      'AGENT EXPLORER',
      'Discover available agents and models',
      '1.0.0'
    ));

    try {
      const api = new OpenRouterAPI();

      if (options.agents) {
        await listAgents(options.format);
      } else if (options.models || options.jsonOnly || options.imageGen) {
        await listModels(api, options);
      } else {
        // Default: show both agents and models
        await listAgents(options.format);
        console.log(); // spacing
        await listModels(api, { ...options, models: true });
      }
    } catch (error) {
      console.log(ASCIIArt.createError(`Failed to list: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

async function listAgents(format: string) {
  console.log(chalk.yellow.bold('📋 Configured Agents'));
  
  // TODO: This would read from actual config files
  const sampleAgents = [
    {
      name: 'mock-data-gen',
      type: 'mock-data',
      description: 'Generates realistic test data',
      model: 'anthropic/claude-3.5-sonnet',
      status: 'active'
    },
    {
      name: 'code-helper',
      type: 'code-generator',
      description: 'Generates clean code',
      model: 'anthropic/claude-3.5-sonnet',
      status: 'active'
    },
    {
      name: 'translator-pro',
      type: 'translator',
      description: 'Multi-language translator',
      model: 'anthropic/claude-3-haiku',
      status: 'inactive'
    }
  ];

  if (format === 'json') {
    console.log(JSON.stringify(sampleAgents, null, 2));
    return;
  }

  if (sampleAgents.length === 0) {
    console.log(ASCIIArt.createInfo('No agents configured yet. Create your first agent with:'));
    console.log(chalk.cyan('  openrouter-agents create'));
    return;
  }

  const headers = ['Name', 'Type', 'Model', 'Status', 'Description'];
  const rows = sampleAgents.map(agent => [
    agent.name,
    agent.type,
    agent.model,
    agent.status === 'active' ? chalk.green('●') : chalk.red('●'),
    agent.description
  ]);

  console.log(ASCIIArt.createTable(headers, rows));

  console.log(ASCIIArt.createSection('Commands', [
    `Chat with agent: ${chalk.cyan('openrouter-agents chat <name>')}`,
    `Test agent: ${chalk.cyan('openrouter-agents test <name>')}`,
    `Create new agent: ${chalk.cyan('openrouter-agents create')}`
  ]));
}

async function listModels(api: OpenRouterAPI, options: any) {
  console.log(chalk.yellow.bold('🤖 Available Models'));
  console.log(ASCIIArt.createSpinner('Fetching models from OpenRouter...'));

  try {
    if (options.imageGen) {
      const models = await api.fetchImageGenerationModels();
      displayModels(models, 'Image Generation Models', options.format);
    } else if (options.categories) {
      const categories = await api.getModelsByCategory();
      
      if (options.format === 'json') {
        console.log(JSON.stringify(categories, null, 2));
        return;
      }

      for (const category of categories) {
        console.log(chalk.cyan.bold(`\n📂 ${category.name}`));
        console.log(chalk.gray(`   ${category.description}\n`));
        
        const headers = ['Model', 'Context', 'Pricing'];
        const rows = category.models.slice(0, 5).map(model => [
          model.name || model.id,
          `${Math.floor(model.context_length / 1000)}k`,
          formatPrice(model.pricing.prompt)
        ]);
        
        console.log(ASCIIArt.createTable(headers, rows));
      }
    } else {
      const models = await api.fetchAvailableModels(options.jsonOnly);
      const title = options.jsonOnly ? 'JSON-Capable Models' : 'All Available Models';
      displayModels(models, title, options.format);
    }

    if (options.format !== 'json') {
      console.log(ASCIIArt.createSection('Model Selection Tips', [
        chalk.green('Free models: ') + 'Good for testing and light usage',
        chalk.blue('Claude models: ') + 'Excellent for complex reasoning and JSON',
        chalk.yellow('GPT models: ') + 'Great performance and wide capability',
        chalk.magenta('Llama models: ') + 'Open source, good for specialized tasks'
      ]));
    }

  } catch (error) {
    console.log(ASCIIArt.createError('Failed to fetch models. Using fallback list.'));
    const fallbackModels = api.getFallbackModels(options.jsonOnly);
    displayModels(fallbackModels, 'Fallback Models', options.format);
  }
}

function displayModels(models: any[], title: string, format: string) {
  console.log(`\n${chalk.cyan.bold(title)} (${models.length} models)`);

  if (format === 'json') {
    console.log(JSON.stringify(models, null, 2));
    return;
  }

  if (models.length === 0) {
    console.log(ASCIIArt.createInfo('No models match your criteria.'));
    return;
  }

  const headers = ['Model Name', 'ID', 'Context', 'Pricing', 'Features'];
  const rows = models.slice(0, 10).map(model => [
    model.name || model.id,
    model.id,
    `${Math.floor(model.context_length / 1000)}k`,
    formatPrice(model.pricing.prompt),
    getModelFeatures(model)
  ]);

  console.log(ASCIIArt.createTable(headers, rows));

  if (models.length > 10) {
    console.log(ASCIIArt.createInfo(`... and ${models.length - 10} more models`));
    console.log(chalk.gray('Use --format json to see all models'));
  }
}

function formatPrice(priceStr: string): string {
  const price = parseFloat(priceStr);
  
  if (price === 0) {
    return chalk.green('Free');
  } else if (price < 0.0001) {
    return `$${(price * 1000000).toFixed(1)}/1M`;
  } else if (price < 0.001) {
    return `$${(price * 1000).toFixed(2)}/1k`;
  } else {
    return `$${price.toFixed(3)}/1k`;
  }
}

function getModelFeatures(model: any): string {
  const features: string[] = [];
  
  if (model.supported_generation_methods?.includes('json_object')) {
    features.push('JSON');
  }
  
  if (model.architecture?.modality?.includes('image')) {
    features.push('IMG');
  }
  
  if (model.pricing?.image) {
    features.push('GEN');
  }
  
  if (parseFloat(model.pricing.prompt) === 0) {
    features.push('FREE');
  }
  
  return features.length > 0 ? features.join(', ') : '—';
}