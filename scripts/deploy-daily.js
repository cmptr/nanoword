#!/usr/bin/env node

/**
 * Deploy Daily Puzzle Script
 * Generates today's puzzle, uploads to KV, and deploys to Cloudflare Workers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DailyDeployer {
  constructor() {
    this.puzzleDir = path.join(__dirname, '..', 'daily-puzzles');
    this.ensurePuzzleDir();
  }

  ensurePuzzleDir() {
    if (!fs.existsSync(this.puzzleDir)) {
      fs.mkdirSync(this.puzzleDir, { recursive: true });
    }
  }

  getDateString() {
    const now = new Date();
    // Use America/Chicago timezone for consistency with daily puzzle
    return now.toLocaleDateString('en-CA', {
      timeZone: 'America/Chicago'
    }); // YYYY-MM-DD format
  }

  async generateDailyPuzzle() {
    console.log('🎯 Generating today\'s daily puzzle...');
    
    try {
      // Generate the puzzle using the existing CLI
      execSync('npm run generate', { stdio: 'inherit' });
      console.log('✅ Daily puzzle generated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error generating puzzle:', error.message);
      return false;
    }
  }

  async uploadToKV() {
    console.log('📤 Uploading puzzle to Cloudflare KV...');
    
    try {
      execSync('npm run kv:populate', { stdio: 'inherit' });
      console.log('✅ Puzzle uploaded to KV successfully');
      return true;
    } catch (error) {
      console.error('❌ Error uploading to KV:', error.message);
      return false;
    }
  }

  async deployWorker() {
    console.log('🚀 Deploying to Cloudflare Workers...');
    
    try {
      execSync('npm run deploy', { stdio: 'inherit' });
      console.log('✅ Worker deployed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deploying worker:', error.message);
      return false;
    }
  }

  async verifyKVUpload() {
    console.log('🔍 Verifying KV upload...');
    
    try {
      const output = execSync('npm run kv:list', { encoding: 'utf8' });
      const today = this.getDateString();
      const puzzleKey = `puzzle-${today}`;
      
      if (output.includes(puzzleKey)) {
        console.log(`✅ Puzzle ${puzzleKey} found in KV`);
        return true;
      } else {
        console.log(`❌ Puzzle ${puzzleKey} not found in KV`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error verifying KV upload:', error.message);
      return false;
    }
  }

  async run() {
    const today = this.getDateString();
    console.log(`🌅 Deploying daily puzzle for ${today}`);
    console.log('=' .repeat(50));
    
    const startTime = Date.now();
    let success = true;
    
    // Step 1: Generate puzzle
    console.log('\n📝 Step 1: Generating puzzle...');
    if (!(await this.generateDailyPuzzle())) {
      success = false;
    }
    
    if (success) {
      // Step 2: Upload to KV
      console.log('\n📤 Step 2: Uploading to KV...');
      if (!(await this.uploadToKV())) {
        success = false;
      }
    }
    
    if (success) {
      // Step 3: Verify upload
      console.log('\n🔍 Step 3: Verifying upload...');
      if (!(await this.verifyKVUpload())) {
        success = false;
      }
    }
    
    if (success) {
      // Step 4: Deploy worker
      console.log('\n🚀 Step 4: Deploying worker...');
      if (!(await this.deployWorker())) {
        success = false;
      }
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n' + '=' .repeat(50));
    
    if (success) {
      console.log('🎉 Daily deployment completed successfully!');
      console.log(`⏱️  Total time: ${duration} seconds`);
      console.log('\n🌐 Your daily puzzle is now live at:');
      console.log('   https://nanoword.cmptr.workers.dev');
      console.log('\n📋 Next steps:');
      console.log('   - Visit the site to test the puzzle');
      console.log('   - Share with users');
      console.log('   - Monitor for any issues');
    } else {
      console.log('❌ Daily deployment failed!');
      console.log(`⏱️  Time elapsed: ${duration} seconds`);
      console.log('\n🔧 Troubleshooting:');
      console.log('   - Check your Cloudflare authentication: wrangler whoami');
      console.log('   - Verify KV namespace exists: npm run kv:list');
      console.log('   - Check worker logs: wrangler tail');
      process.exit(1);
    }
  }
}

async function main() {
  const deployer = new DailyDeployer();
  await deployer.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = DailyDeployer;
