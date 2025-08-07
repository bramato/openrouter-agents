import { Command } from 'commander';
import { ASCIIArt } from '../utils/ascii-art.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';

export const testCommand = new Command()
  .name('test')
  .description('Test agent functionality')
  .argument('[agent]', 'Agent name to test')
  .option('--input-file <file>', 'File containing test inputs')
  .option('--output-file <file>', 'File to save test results')
  .option('--benchmark', 'Run performance benchmark')
  .option('--iterations <count>', 'Number of test iterations', parseInt, 1)
  .option('--timeout <ms>', 'Timeout per test in milliseconds', parseInt, 30000)
  .action(async (agentName?: string, options: any = {}) => {
    // Show ASCII art intro
    console.log(ASCIIArt.createBanner(
      'AGENT TESTING',
      'Validate and benchmark your AI agents',
      '1.0.0'
    ));

    try {
      if (!agentName) {
        console.log(ASCIIArt.createError('Agent name is required'));
        console.log(ASCIIArt.createInfo('Usage: openrouter-agents test <agent-name>'));
        return;
      }

      if (options.benchmark) {
        await runBenchmark(agentName, options);
      } else {
        await runBasicTest(agentName, options);
      }

    } catch (error) {
      console.log(ASCIIArt.createError(`Test error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

async function runBasicTest(agentName: string, options: any) {
  console.log(chalk.yellow.bold(`🧪 Testing Agent: ${agentName}`));
  
  // Load test cases
  let testCases: any[] = [];
  
  if (options.inputFile) {
    try {
      const fileContent = await fs.readFile(options.inputFile, 'utf-8');
      testCases = JSON.parse(fileContent);
    } catch (error) {
      console.log(ASCIIArt.createError(`Failed to load test file: ${options.inputFile}`));
      return;
    }
  } else {
    // Use default test cases based on agent type
    testCases = getDefaultTestCases(agentName);
  }

  console.log(ASCIIArt.createSection('Test Configuration', [
    `Agent: ${chalk.cyan(agentName)}`,
    `Test Cases: ${chalk.cyan(testCases.length.toString())}`,
    `Iterations: ${chalk.cyan(options.iterations.toString())}`,
    `Timeout: ${chalk.cyan(options.timeout.toString())}ms`
  ]));

  const results: any[] = [];
  let passed = 0;
  let failed = 0;

  console.log(chalk.yellow.bold('\n📊 Running Tests...'));
  console.log('━'.repeat(60));

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testName = testCase.name || `Test ${i + 1}`;
    
    process.stdout.write(`${chalk.blue('●')} ${testName}... `);

    try {
      const startTime = Date.now();
      
      // TODO: Actually run the agent test
      const result = await simulateAgentTest(agentName, testCase, options.timeout);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (result.success) {
        console.log(chalk.green(`✓ (${duration}ms)`));
        passed++;
      } else {
        console.log(chalk.red(`✗ ${result.error}`));
        failed++;
      }

      results.push({
        name: testName,
        success: result.success,
        duration,
        error: result.error,
        input: testCase.input,
        output: result.output
      });

    } catch (error) {
      console.log(chalk.red(`✗ ${error instanceof Error ? error.message : 'Unknown error'}`));
      failed++;
      
      results.push({
        name: testName,
        success: false,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        input: testCase.input,
        output: null
      });
    }
  }

  // Show summary
  console.log('━'.repeat(60));
  console.log(ASCIIArt.createSection('Test Results', [
    `Total Tests: ${chalk.cyan((passed + failed).toString())}`,
    `Passed: ${chalk.green(passed.toString())}`,
    `Failed: ${chalk.red(failed.toString())}`,
    `Success Rate: ${chalk.cyan(((passed / (passed + failed)) * 100).toFixed(1) + '%')}`,
    `Average Duration: ${chalk.cyan(Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length).toString() + 'ms')}`
  ]));

  // Save results if requested
  if (options.outputFile) {
    try {
      await fs.writeFile(options.outputFile, JSON.stringify(results, null, 2));
      console.log(ASCIIArt.createSuccess(`Test results saved to: ${options.outputFile}`));
    } catch (error) {
      console.log(ASCIIArt.createWarning(`Failed to save results: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  if (failed > 0) {
    console.log(ASCIIArt.createSection('Failed Tests', 
      results.filter(r => !r.success).map(r => `${r.name}: ${r.error}`)
    ));
  }
}

async function runBenchmark(agentName: string, options: any) {
  console.log(chalk.yellow.bold(`⚡ Benchmarking Agent: ${agentName}`));
  
  const testCases = getDefaultTestCases(agentName);
  const iterations = Math.max(options.iterations, 3); // Minimum 3 for statistical significance
  
  console.log(ASCIIArt.createSection('Benchmark Configuration', [
    `Agent: ${chalk.cyan(agentName)}`,
    `Test Cases: ${chalk.cyan(testCases.length.toString())}`,
    `Iterations per Test: ${chalk.cyan(iterations.toString())}`,
    `Total Operations: ${chalk.cyan((testCases.length * iterations).toString())}`
  ]));

  const benchmarkResults: any[] = [];
  let totalOperations = 0;
  let totalTime = 0;

  console.log(chalk.yellow.bold('\n🏃 Running Benchmark...'));
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testName = testCase.name || `Test ${i + 1}`;
    
    console.log(`\n${chalk.blue('▶')} ${testName}`);
    
    const times: number[] = [];
    let successCount = 0;
    
    for (let iter = 0; iter < iterations; iter++) {
      process.stdout.write(`  Iteration ${iter + 1}/${iterations}... `);
      
      try {
        const startTime = Date.now();
        const result = await simulateAgentTest(agentName, testCase, options.timeout);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        times.push(duration);
        if (result.success) successCount++;
        
        console.log(chalk.green(`${duration}ms`));
        
      } catch (error) {
        console.log(chalk.red(`Error`));
      }
      
      totalOperations++;
    }
    
    // Calculate statistics
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = (successCount / iterations) * 100;
    
    totalTime += avgTime;
    
    benchmarkResults.push({
      testName,
      avgTime: Math.round(avgTime),
      minTime,
      maxTime,
      successRate: Math.round(successRate),
      iterations
    });
    
    console.log(`    ${chalk.gray(`Avg: ${Math.round(avgTime)}ms, Range: ${minTime}-${maxTime}ms, Success: ${Math.round(successRate)}%`)}`);
  }

  // Show benchmark summary
  console.log('\n' + '━'.repeat(60));
  console.log(chalk.green.bold('📈 Benchmark Summary'));
  console.log('━'.repeat(60));

  const headers = ['Test', 'Avg Time', 'Min/Max', 'Success Rate'];
  const rows = benchmarkResults.map(result => [
    result.testName,
    `${result.avgTime}ms`,
    `${result.minTime}/${result.maxTime}ms`,
    `${result.successRate}%`
  ]);

  console.log(ASCIIArt.createTable(headers, rows));

  const overallAvgTime = totalTime / benchmarkResults.length;
  const overallSuccessRate = benchmarkResults.reduce((sum, r) => sum + r.successRate, 0) / benchmarkResults.length;
  
  console.log(ASCIIArt.createSection('Overall Performance', [
    `Average Response Time: ${chalk.cyan(Math.round(overallAvgTime).toString() + 'ms')}`,
    `Overall Success Rate: ${chalk.cyan(Math.round(overallSuccessRate).toString() + '%')}`,
    `Total Operations: ${chalk.cyan(totalOperations.toString())}`,
    `Throughput: ${chalk.cyan((totalOperations / (totalTime / 1000)).toFixed(2) + ' ops/sec')}`
  ]));

  // Performance rating
  const rating = getPerformanceRating(overallAvgTime, overallSuccessRate);
  console.log(`\n${rating.icon} ${rating.message}`);
}

function getDefaultTestCases(agentName: string): any[] {
  // Return different test cases based on agent type/name
  if (agentName.includes('mock') || agentName.includes('data')) {
    return [
      { name: 'Simple JSON Schema', input: '{"name": "string", "age": "number"}' },
      { name: 'Complex Object', input: '{"user": {"profile": {"name": "string", "contacts": ["string"]}}}' },
      { name: 'Array Generation', input: 'Generate 5 user objects with id, name, email' }
    ];
  }
  
  if (agentName.includes('code')) {
    return [
      { name: 'Function Generation', input: 'Create a function that sorts an array' },
      { name: 'Class Creation', input: 'Create a User class with basic CRUD methods' },
      { name: 'Algorithm Implementation', input: 'Implement binary search in JavaScript' }
    ];
  }
  
  if (agentName.includes('translate')) {
    return [
      { name: 'Simple Translation', input: 'Hello, how are you?' },
      { name: 'Technical Text', input: 'The API endpoint returns a JSON response' },
      { name: 'Long Text', input: 'This is a longer paragraph with multiple sentences to test translation accuracy.' }
    ];
  }
  
  // Default test cases
  return [
    { name: 'Basic Query', input: 'Hello, can you help me?' },
    { name: 'Technical Question', input: 'What is the difference between async and sync?' },
    { name: 'Complex Request', input: 'Explain the concept and provide examples' }
  ];
}

async function simulateAgentTest(agentName: string, testCase: any, timeout: number): Promise<any> {
  // Simulate processing time
  const processingTime = 500 + Math.random() * 2000;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate occasional failures
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        resolve({
          success: true,
          output: `Mock response for: ${testCase.input}`,
          error: null
        });
      } else {
        resolve({
          success: false,
          output: null,
          error: 'Simulated processing error'
        });
      }
    }, processingTime);
  });
}

function getPerformanceRating(avgTime: number, successRate: number) {
  if (successRate >= 95 && avgTime < 1000) {
    return { icon: chalk.green('🏆'), message: chalk.green('Excellent performance!') };
  } else if (successRate >= 85 && avgTime < 2000) {
    return { icon: chalk.blue('🥈'), message: chalk.blue('Good performance') };
  } else if (successRate >= 75 && avgTime < 3000) {
    return { icon: chalk.yellow('🥉'), message: chalk.yellow('Acceptable performance') };
  } else {
    return { icon: chalk.red('⚠️'), message: chalk.red('Performance needs improvement') };
  }
}