import figlet from 'figlet';
import chalk from 'chalk';

export class ASCIIArt {
  static async createTitle(text: string, options?: {
    font?: string;
    gradient?: boolean;
    border?: boolean;
  }): Promise<string> {
    const font = options?.font || 'Big';
    
    return new Promise((resolve) => {
      figlet(text, { font: font as any }, (err, data) => {
        if (err) {
          resolve(text); // Fallback to plain text
          return;
        }
        
        let result = data || text;
        
        if (options?.gradient) {
          result = chalk.cyan(result);
        }
        
        if (options?.border) {
          const lines = result.split('\n');
          const maxLength = Math.max(...lines.map(line => line.length));
          const border = '═'.repeat(maxLength + 4);
          
          result = [
            `╔${border}╗`,
            ...lines.map(line => `║  ${line.padEnd(maxLength)}  ║`),
            `╚${border}╝`
          ].join('\n');
        }
        
        resolve(result);
      });
    });
  }

  static createBanner(title: string, subtitle?: string, version?: string): string {
    const width = 50;
    const border = '═'.repeat(width - 2);
    
    let content = [
      `╔${border}╗`,
      `║${' '.repeat(width - 2)}║`,
      `║  🤖 ${title.toUpperCase().padEnd(width - 7)} ║`,
    ];

    if (version) {
      content.push(`║${(' v' + version).padStart(width - 1).padEnd(width - 1)}║`);
    }

    content.push(`║${' '.repeat(width - 2)}║`);

    if (subtitle) {
      const subtitleLines = this.wrapText(subtitle, width - 6);
      subtitleLines.forEach(line => {
        content.push(`║  ${line.padEnd(width - 4)}  ║`);
      });
      content.push(`║${' '.repeat(width - 2)}║`);
    }

    content.push(`╚${border}╝`);

    return chalk.cyan(content.join('\n'));
  }

  static createSection(title: string, items: string[]): string {
    const result = [
      chalk.yellow.bold(`\n${title}:`),
      ...items.map(item => `  ${chalk.green('●')} ${item}`)
    ];
    
    return result.join('\n');
  }

  static createTable(headers: string[], rows: string[][]): string {
    if (rows.length === 0) return '';

    // Calculate column widths
    const colWidths = headers.map((header, i) => {
      const maxContentWidth = Math.max(...rows.map(row => (row[i] || '').length));
      return Math.max(header.length, maxContentWidth);
    });

    // Create separator
    const separator = '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
    const topBorder = '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
    const bottomBorder = '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';

    // Create header
    const headerRow = '│ ' + headers.map((header, i) => 
      chalk.bold(header.padEnd(colWidths[i]))
    ).join(' │ ') + ' │';

    // Create data rows
    const dataRows = rows.map(row => 
      '│ ' + row.map((cell, i) => 
        (cell || '').padEnd(colWidths[i])
      ).join(' │ ') + ' │'
    );

    return [
      topBorder,
      headerRow,
      separator,
      ...dataRows,
      bottomBorder
    ].join('\n');
  }

  static createProgressBar(current: number, total: number, width: number = 30): string {
    const progress = Math.round((current / total) * width);
    const remaining = width - progress;
    
    const filled = '█'.repeat(progress);
    const empty = '░'.repeat(remaining);
    const percentage = Math.round((current / total) * 100);
    
    return `[${chalk.green(filled)}${chalk.gray(empty)}] ${percentage}%`;
  }

  static createSuccess(message: string): string {
    return chalk.green(`✅ ${message}`);
  }

  static createError(message: string): string {
    return chalk.red(`❌ ${message}`);
  }

  static createWarning(message: string): string {
    return chalk.yellow(`⚠️  ${message}`);
  }

  static createInfo(message: string): string {
    return chalk.blue(`ℹ️  ${message}`);
  }

  static createSpinner(text: string): string {
    return chalk.cyan(`⏳ ${text}`);
  }

  private static wrapText(text: string, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  static createLogo(): string {
    return chalk.cyan(`
    ╭─────────────────────────────────────╮
    │  🚀 OpenRouter Agents Platform      │
    │                                     │
    │  ┌─┐┌─┐┌─┐┌─┐┌┐┌┬─┐┌─┐┬ ┬┌┬┐┌─┐┬─┐ │
    │  │ │├─┘├┤ │││├┴┐├┬┘│ ││ │ │ ├┤ ├┬┘ │
    │  └─┘┴  └─┘┘└┘┴ ┴┴└─└─┘└─┘ ┴ └─┘┴└─ │
    │                                     │
    │  🤖 AI Agents for Every Task        │
    ╰─────────────────────────────────────╯
    `);
  }
}