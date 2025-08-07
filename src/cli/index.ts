#!/usr/bin/env node

import { Command } from 'commander';
import { ASCIIArt } from './utils/ascii-art';
import chalk from 'chalk';
import { version } from '../index';

// Import commands
import { createCommand } from './commands/create';
import { listCommand } from './commands/list';
import { configCommand } from './commands/config';
import { chatCommand } from './commands/chat';
import { testCommand } from './commands/test';

const program = new Command();

// Configure the main program
program
  .name('openrouter-agents')
  .description('Intelligent AI Agents for every development task')
  .version(version)
  .hook('preAction', async (thisCommand) => {
    // Show ASCII art for main command
    if (thisCommand.name() === 'openrouter-agents' && process.argv.length <= 3) {
      console.log(ASCIIArt.createLogo());
      console.log(chalk.cyan.bold('🤖 OpenRouter Agents Platform'));
      console.log(chalk.gray('Intelligent AI Agents for Every Development Task\n'));
    }
  });

// Add all commands
program.addCommand(createCommand);
program.addCommand(listCommand);
program.addCommand(configCommand);
program.addCommand(chatCommand);
program.addCommand(testCommand);

// Custom help with ASCII art
program.on('--help', () => {
  console.log(ASCIIArt.createSection('Examples', [
    'openrouter-agents create mock-data',
    'openrouter-agents chat translator',
    'openrouter-agents list --models --json-only',
    'openrouter-agents config --set-key your-api-key'
  ]));
  
  console.log(ASCIIArt.createSection('Links', [
    'Documentation: https://github.com/bramato/openrouter-agents',
    'NPM Package: https://www.npmjs.com/package/openrouter-agents',
    'OpenRouter: https://openrouter.ai'
  ]));
});

// Handle unknown commands
program.on('command:*', (operands) => {
  console.log(ASCIIArt.createError(`Unknown command: ${operands[0]}`));
  console.log(ASCIIArt.createInfo('Run "openrouter-agents --help" to see available commands'));
  process.exitCode = 1;
});

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export default program;