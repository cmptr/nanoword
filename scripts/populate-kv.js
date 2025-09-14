#!/usr/bin/env node

/**
 * Script to populate Cloudflare KV with existing daily puzzles
 * Run this after setting up your KV namespace
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class KVPopulator {
  constructor() {
    this.puzzleDir = path.join(__dirname, '..', 'daily-puzzles');
  }

  async populateKV() {
    console.log('🚀 Populating Cloudflare KV with existing puzzles...');
    
    if (!fs.existsSync(this.puzzleDir)) {
      console.log('❌ No daily-puzzles directory found. Run puzzle generation first.');
      return;
    }

    const puzzleFiles = fs.readdirSync(this.puzzleDir)
      .filter(file => file.startsWith('puzzle-') && file.endsWith('.json'))
      .sort();

    if (puzzleFiles.length === 0) {
      console.log('❌ No puzzle files found. Run "npm run generate" first.');
      return;
    }

    console.log(`📋 Found ${puzzleFiles.length} puzzle files`);

    for (const file of puzzleFiles) {
      try {
        const puzzlePath = path.join(this.puzzleDir, file);
        const puzzleData = JSON.parse(fs.readFileSync(puzzlePath, 'utf8'));
        
        // Extract date from filename (puzzle-YYYY-MM-DD.json)
        const dateMatch = file.match(/puzzle-(\d{4}-\d{2}-\d{2})\.json/);
        if (!dateMatch) {
          console.log(`⚠️  Skipping ${file} - invalid filename format`);
          continue;
        }
        
        const date = dateMatch[1];
        const key = `puzzle-${date}`;
        
        // Store in KV using wrangler with namespace ID
        // First try to get the namespace ID from wrangler.toml or environment
        let namespaceId = process.env.KV_NAMESPACE_ID;
        
        if (!namespaceId) {
          // Try to read from wrangler.toml
          try {
            const fs = require('fs');
            const tomlContent = fs.readFileSync('wrangler.toml', 'utf8');
            const idMatch = tomlContent.match(/id\s*=\s*"([^"]+)"/);
            if (idMatch) {
              namespaceId = idMatch[1];
            }
          } catch (error) {
            console.log(`⚠️  Could not read wrangler.toml: ${error.message}`);
          }
        }
        
        if (!namespaceId) {
          console.log(`❌ No namespace ID found. Please set KV_NAMESPACE_ID environment variable or update wrangler.toml`);
          console.log(`   You can get the namespace ID by running: npm run kv:list`);
          continue;
        }
        
        const command = `wrangler kv key put "${key}" --path="${puzzlePath}" --namespace-id="${namespaceId}"`;
        console.log(`📤 Uploading ${key}...`);
        
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ Successfully uploaded ${key}`);
        
      } catch (error) {
        console.error(`❌ Error uploading ${file}:`, error.message);
      }
    }

    console.log('🎉 KV population complete!');
  }

  async listKVContents() {
    console.log('📋 Listing KV contents...');
    try {
      execSync('wrangler kv:key list', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Error listing KV contents:', error.message);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'populate';

  const populator = new KVPopulator();

  try {
    switch (command) {
      case 'populate':
        await populator.populateKV();
        break;
      case 'list':
        await populator.listKVContents();
        break;
      default:
        console.log('Usage: node populate-kv.js [populate|list]');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = KVPopulator;
