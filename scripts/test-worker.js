#!/usr/bin/env node

/**
 * Test script for the Cloudflare Worker
 * Tests the worker locally to ensure it works correctly
 */

const { execSync } = require('child_process');

class WorkerTester {
  constructor() {
    this.workerUrl = null;
  }

  async startWorker() {
    console.log('🚀 Starting Cloudflare Worker locally...');
    
    try {
      // Start the worker in the background
      const child = execSync('npm run dev-worker', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Extract the URL from the output
      const output = child.toString();
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      
      if (urlMatch) {
        this.workerUrl = urlMatch[0];
        console.log(`✅ Worker started at: ${this.workerUrl}`);
        return true;
      } else {
        console.log('❌ Could not extract worker URL from output');
        return false;
      }
    } catch (error) {
      console.error('❌ Error starting worker:', error.message);
      return false;
    }
  }

  async testWorker() {
    if (!this.workerUrl) {
      console.log('❌ Worker not started. Call startWorker() first.');
      return false;
    }

    console.log('🧪 Testing worker functionality...');

    try {
      // Test the main route
      const response = await fetch(this.workerUrl);
      
      if (!response.ok) {
        console.log(`❌ Worker returned status: ${response.status}`);
        return false;
      }

      const html = await response.text();
      
      // Check if the response contains expected elements
      const checks = [
        { name: 'HTML title', test: html.includes('<title>nanoword</title>') },
        { name: 'Puzzle container', test: html.includes('daily-container') },
        { name: 'Puzzle grid', test: html.includes('puzzleGrid') },
        { name: 'Timer display', test: html.includes('timer') },
        { name: 'Clues section', test: html.includes('acrossClues') && html.includes('downClues') },
        { name: 'JavaScript puzzle data', test: html.includes('const puzzleData =') }
      ];

      let allPassed = true;
      checks.forEach(check => {
        if (check.test) {
          console.log(`✅ ${check.name}`);
        } else {
          console.log(`❌ ${check.name}`);
          allPassed = false;
        }
      });

      if (allPassed) {
        console.log('🎉 All tests passed! Worker is working correctly.');
      } else {
        console.log('⚠️  Some tests failed. Check the worker implementation.');
      }

      return allPassed;

    } catch (error) {
      console.error('❌ Error testing worker:', error.message);
      return false;
    }
  }

  async testKVIntegration() {
    console.log('🗄️  Testing KV integration...');
    
    try {
      // Check if we can list KV contents
      execSync('npm run kv:list', { stdio: 'inherit' });
      console.log('✅ KV integration working');
      return true;
    } catch (error) {
      console.log('⚠️  KV integration test failed:', error.message);
      console.log('   Make sure you have created a KV namespace and are authenticated');
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Running Cloudflare Worker tests...\n');

    // Test KV integration first
    await this.testKVIntegration();
    console.log('');

    // Start worker
    const workerStarted = await this.startWorker();
    if (!workerStarted) {
      console.log('❌ Cannot run tests - worker failed to start');
      return false;
    }

    // Wait a moment for worker to fully start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test worker functionality
    const testsPassed = await this.testWorker();

    console.log('\n📊 Test Summary:');
    console.log(`Worker started: ${workerStarted ? '✅' : '❌'}`);
    console.log(`Tests passed: ${testsPassed ? '✅' : '❌'}`);

    if (workerStarted && testsPassed) {
      console.log('\n🎉 All tests passed! Your worker is ready for deployment.');
      console.log(`\n🌐 Test your worker at: ${this.workerUrl}`);
      console.log('\n📝 Next steps:');
      console.log('1. Generate some puzzles: npm run generate');
      console.log('2. Upload to KV: npm run kv:populate');
      console.log('3. Deploy: npm run deploy');
    } else {
      console.log('\n❌ Some tests failed. Please check the issues above.');
    }

    return workerStarted && testsPassed;
  }
}

async function main() {
  const tester = new WorkerTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = WorkerTester;
