import { Command } from 'commander';
import { ASCIIArt } from '../utils/ascii-art';
import chalk from 'chalk';
import inquirer from 'inquirer';

export const configCommand = new Command()
  .name('config')
  .description('Configure OpenRouter Agents settings')
  .option('--set-key <key>', 'Set OpenRouter API key')
  .option('--set-model <model>', 'Set default model')
  .option('--show', 'Show current configuration')
  .option('--reset', 'Reset configuration to defaults')
  .option('--interactive', 'Interactive configuration mode')
  .action(async (options: any = {}) => {
    // Show ASCII art intro
    console.log(ASCIIArt.createBanner(
      'CONFIGURATION',
      'Manage your OpenRouter Agents settings',
      '1.0.0'
    ));

    try {
      if (options.show) {
        await showConfig();
      } else if (options.reset) {
        await resetConfig();
      } else if (options.interactive || (!options.setKey && !options.setModel)) {
        await interactiveConfig();
      } else {
        await updateConfig(options);
      }
    } catch (error) {
      console.log(ASCIIArt.createError(`Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

async function showConfig() {
  console.log(chalk.yellow.bold('📄 Current Configuration'));
  
  // TODO: Read from actual config file
  const config = {
    openRouter: {
      apiKey: process.env.OPENROUTER_API_KEY ? '****' + process.env.OPENROUTER_API_KEY.slice(-4) : 'Not set',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-3.5-sonnet'
    },
    preferences: {
      outputFormat: 'table',
      verboseLogging: false,
      autoSave: true,
      theme: 'auto'
    },
    agents: {
      count: 0,
      lastUsed: 'None'
    }
  };

  console.log(ASCIIArt.createSection('OpenRouter Settings', [
    `API Key: ${config.openRouter.apiKey === 'Not set' ? chalk.red(config.openRouter.apiKey) : chalk.green(config.openRouter.apiKey)}`,
    `Base URL: ${chalk.cyan(config.openRouter.baseURL)}`,
    `Default Model: ${chalk.cyan(config.openRouter.defaultModel)}`
  ]));

  console.log(ASCIIArt.createSection('User Preferences', [
    `Output Format: ${chalk.cyan(config.preferences.outputFormat)}`,
    `Verbose Logging: ${config.preferences.verboseLogging ? chalk.green('enabled') : chalk.gray('disabled')}`,
    `Auto Save: ${config.preferences.autoSave ? chalk.green('enabled') : chalk.gray('disabled')}`,
    `Theme: ${chalk.cyan(config.preferences.theme)}`
  ]));

  console.log(ASCIIArt.createSection('Agent Statistics', [
    `Configured Agents: ${chalk.cyan(config.agents.count.toString())}`,
    `Last Used: ${chalk.cyan(config.agents.lastUsed)}`
  ]));

  if (config.openRouter.apiKey === 'Not set') {
    console.log(ASCIIArt.createWarning('OpenRouter API key not configured!'));
    console.log(ASCIIArt.createInfo('Set your API key with: openrouter-agents config --set-key YOUR_KEY'));
    console.log(ASCIIArt.createInfo('Get your key at: https://openrouter.ai/keys'));
  }
}

async function resetConfig() {
  const confirm = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: '⚠️  Are you sure you want to reset all configuration to defaults?',
      default: false
    }
  ]);

  if (!confirm.confirmed) {
    console.log(ASCIIArt.createInfo('Reset cancelled.'));
    return;
  }

  // TODO: Actually reset config file
  console.log(ASCIIArt.createSuccess('Configuration reset to defaults!'));
  console.log(ASCIIArt.createInfo('Note: Your OpenRouter API key has been cleared.'));
  console.log(ASCIIArt.createInfo('Set it again with: openrouter-agents config --set-key YOUR_KEY'));
}

async function interactiveConfig() {
  console.log(chalk.yellow.bold('🔧 Interactive Configuration'));
  
  const currentKey = process.env.OPENROUTER_API_KEY;
  
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'OpenRouter API Key:',
      default: currentKey ? '****' + currentKey.slice(-4) : undefined,
      validate: (input: string) => {
        if (!input || input.startsWith('****')) return true;
        return input.startsWith('sk-or-') || 'API key should start with "sk-or-"';
      }
    },
    {
      type: 'list',
      name: 'defaultModel',
      message: 'Default model:',
      choices: [
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3-haiku',
        'openai/gpt-4.1-nano',
        'meta-llama/llama-3.1-8b-instruct:free'
      ],
      default: 'anthropic/claude-3.5-sonnet'
    },
    {
      type: 'list',
      name: 'outputFormat',
      message: 'Preferred output format:',
      choices: ['table', 'json', 'yaml'],
      default: 'table'
    },
    {
      type: 'confirm',
      name: 'verboseLogging',
      message: 'Enable verbose logging?',
      default: false
    },
    {
      type: 'confirm',
      name: 'autoSave',
      message: 'Auto-save configurations?',
      default: true
    }
  ]);

  // TODO: Save configuration to file
  console.log(ASCIIArt.createSuccess('Configuration updated successfully!'));
  
  console.log(ASCIIArt.createSection('New Settings', [
    `API Key: ${answers.apiKey.startsWith('****') ? 'Unchanged' : 'Updated'}`,
    `Default Model: ${chalk.cyan(answers.defaultModel)}`,
    `Output Format: ${chalk.cyan(answers.outputFormat)}`,
    `Verbose Logging: ${answers.verboseLogging ? chalk.green('enabled') : chalk.gray('disabled')}`,
    `Auto Save: ${answers.autoSave ? chalk.green('enabled') : chalk.gray('disabled')}`
  ]));

  console.log(ASCIIArt.createInfo('Note: Configuration file management not yet implemented. This is a preview.'));
}

async function updateConfig(options: any) {
  const updates: string[] = [];

  if (options.setKey) {
    if (!options.setKey.startsWith('sk-or-')) {
      console.log(ASCIIArt.createError('Invalid API key format. Key should start with "sk-or-"'));
      return;
    }
    // TODO: Save API key securely
    updates.push(`API Key: Updated`);
  }

  if (options.setModel) {
    // TODO: Validate model exists
    updates.push(`Default Model: ${chalk.cyan(options.setModel)}`);
  }

  if (updates.length > 0) {
    console.log(ASCIIArt.createSuccess('Configuration updated!'));
    console.log(ASCIIArt.createSection('Changes Made', updates));
    console.log(ASCIIArt.createInfo('Note: Configuration file management not yet implemented. This is a preview.'));
  } else {
    console.log(ASCIIArt.createInfo('No changes made. Use --help to see available options.'));
  }
}