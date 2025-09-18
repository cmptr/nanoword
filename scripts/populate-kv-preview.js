#!/usr/bin/env node

/**
 * Script to populate Cloudflare KV preview namespace with existing daily puzzles
 * This is specifically for local development/preview
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class KVPreviewPopulator {
  constructor() {
    this.puzzleDir = path.join(__dirname, '..', 'daily-puzzles');
    this.previewNamespaceId = 'dd07a3577c3d42b7a491f11e0072cf8b';
  }

  async populatePreviewKV() {
    console.log('🚀 Populating Cloudflare KV preview namespace with existing puzzles...');
    
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
        
        const command = `wrangler kv key put "${key}" --path="${puzzlePath}" --namespace-id="${this.previewNamespaceId}"`;
        console.log(`📤 Uploading ${key} to preview namespace...`);
        
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ Successfully uploaded ${key}`);
        
      } catch (error) {
        console.error(`❌ Error uploading ${file}:`, error.message);
      }
    }

    console.log('🎉 KV preview population complete!');
  }

  async listPreviewKVContents() {
    console.log('📋 Listing KV preview contents...');
    try {
      execSync(`wrangler kv key list --namespace-id="${this.previewNamespaceId}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Error listing KV preview contents:', error.message);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'populate';

  const populator = new KVPreviewPopulator();

  try {
    switch (command) {
      case 'populate':
        await populator.populatePreviewKV();
        break;
      case 'list':
        await populator.listPreviewKVContents();
        break;
      default:
        console.log('Usage: node populate-kv-preview.js [populate|list]');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default KVPreviewPopulator;
