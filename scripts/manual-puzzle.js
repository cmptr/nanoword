#!/usr/bin/env node

/**
 * Manual Puzzle CLI for Nanoword
 * Allows manual creation of word puzzles and uploading to KV storage
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ManualPuzzleCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  validateWord(word) {
    const cleanWord = word.toUpperCase().trim();
    
    if (!cleanWord) {
      throw new Error('Word cannot be empty');
    }
    
    if (cleanWord.length < 4 || cleanWord.length > 10) {
      throw new Error('Word must be between 4-10 letters');
    }
    
    if (!/^[A-Z]+$/.test(cleanWord)) {
      throw new Error('Word must contain only letters A-Z');
    }
    
    return cleanWord;
  }

  validateClue(clue) {
    const cleanClue = clue.trim();
    
    if (!cleanClue) {
      throw new Error('Clue cannot be empty');
    }
    
    if (cleanClue.length < 5) {
      throw new Error('Clue must be at least 5 characters long');
    }
    
    return cleanClue;
  }

  validateDate(dateStr) {
    if (!dateStr) {
      // Default to today in Chicago timezone
      return new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Chicago'
      });
    }
    
    // Validate YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
    
    const date = new Date(dateStr + 'T00:00:00.000Z');
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    return dateStr;
  }

  createPuzzleData(word, clue, date) {
    const wordLength = word.length;
    
    // Create grid structure
    const grid = [
      Array.from({ length: wordLength }, (_, col) => ({
        row: 0,
        col: col,
        contents: "",
        isBlack: false,
        number: "",
        acrossNumber: 1,
        downNumber: ""
      }))
    ];
    
    const solution = [word.split('')];
    
    const clues = {
      across: [
        { number: 1, clue: clue, length: wordLength, answer: word }
      ],
      down: []
    };
    
    const wordsData = {
      across: [
        {
          number: 1,
          length: wordLength,
          clue: clue,
          answer: word,
          positions: Array.from({ length: wordLength }, (_, col) => ({ row: 0, col: col }))
        }
      ],
      down: []
    };
    
    return {
      date: date,
      grid: grid,
      solution: solution,
      clues: clues,
      words: wordsData
    };
  }

  async savePuzzleToFile(puzzleData, date) {
    const puzzleDir = path.join(__dirname, '..', 'daily-puzzles');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(puzzleDir)) {
      fs.mkdirSync(puzzleDir, { recursive: true });
    }
    
    const filename = `puzzle-${date}.json`;
    const filepath = path.join(puzzleDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(puzzleData, null, 2));
    console.log(`✅ Puzzle saved to: ${filepath}`);
    
    return filepath;
  }

  async uploadToKV(filepath, date) {
    try {
      // Get namespace ID from wrangler.toml
      let namespaceId = process.env.KV_NAMESPACE_ID;
      
      if (!namespaceId) {
        try {
          const tomlPath = path.join(__dirname, '..', 'wrangler.toml');
          const tomlContent = fs.readFileSync(tomlPath, 'utf8');
          const idMatch = tomlContent.match(/id\s*=\s*"([^"]+)"/);
          if (idMatch) {
            namespaceId = idMatch[1];
          }
        } catch (error) {
          throw new Error('Could not read wrangler.toml');
        }
      }
      
      if (!namespaceId) {
        throw new Error('No KV namespace ID found. Set KV_NAMESPACE_ID environment variable or update wrangler.toml');
      }
      
      const key = `puzzle-${date}`;
      const command = `wrangler kv key put "${key}" --path="${filepath}" --namespace-id="${namespaceId}"`;
      
      console.log('📤 Uploading to KV...');
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ Successfully uploaded puzzle to KV with key: ${key}`);
      
    } catch (error) {
      console.error('❌ Error uploading to KV:', error.message);
      throw error;
    }
  }

  async createInteractive() {
    console.log('🎯 Manual Puzzle Creator for Nanoword\n');
    
    try {
      // Get word
      const wordInput = await this.prompt('Enter the word (4-10 letters): ');
      const word = this.validateWord(wordInput);
      console.log(`✓ Word: ${word}\n`);
      
      // Get clue
      const clueInput = await this.prompt('Enter the clue: ');
      const clue = this.validateClue(clueInput);
      console.log(`✓ Clue: ${clue}\n`);
      
      // Get date (optional)
      const dateInput = await this.prompt('Enter date (YYYY-MM-DD) or press Enter for today: ');
      const date = this.validateDate(dateInput);
      console.log(`✓ Date: ${date}\n`);
      
      // Confirm
      console.log('📋 Preview:');
      console.log(`   Word: ${word}`);
      console.log(`   Clue: ${clue}`);
      console.log(`   Date: ${date}\n`);
      
      const confirm = await this.prompt('Create this puzzle? (y/N): ');
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled');
        return;
      }
      
      // Create puzzle
      const puzzleData = this.createPuzzleData(word, clue, date);
      const filepath = await this.savePuzzleToFile(puzzleData, date);
      
      // Ask about KV upload
      const uploadConfirm = await this.prompt('\nUpload to KV storage? (y/N): ');
      if (uploadConfirm.toLowerCase() === 'y' || uploadConfirm.toLowerCase() === 'yes') {
        await this.uploadToKV(filepath, date);
      }
      
      console.log('\n🎉 Puzzle creation complete!');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async createFromArgs(word, clue, date) {
    try {
      const validWord = this.validateWord(word);
      const validClue = this.validateClue(clue);
      const validDate = this.validateDate(date);
      
      const puzzleData = this.createPuzzleData(validWord, validClue, validDate);
      const filepath = await this.savePuzzleToFile(puzzleData, validDate);
      
      console.log('📤 Uploading to KV...');
      await this.uploadToKV(filepath, validDate);
      
      console.log('🎉 Puzzle created and uploaded successfully!');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
🎯 Manual Puzzle Creator for Nanoword

Usage:
  node manual-puzzle.js                           # Interactive mode
  node manual-puzzle.js <word> <clue> [date]      # Command line mode
  node manual-puzzle.js --help                    # Show this help

Arguments:
  word    The puzzle word (4-10 letters, A-Z only)
  clue    The clue for the word (quoted if contains spaces)
  date    Date in YYYY-MM-DD format (optional, defaults to today)

Examples:
  node manual-puzzle.js                                    # Interactive
  node manual-puzzle.js STREAM "Flow of water or data"    # Today's date
  node manual-puzzle.js MATRIX "Neo's reality" 2025-01-15 # Specific date

Environment:
  KV_NAMESPACE_ID    Cloudflare KV namespace ID (optional if in wrangler.toml)
`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cli = new ManualPuzzleCLI();
  
  if (args.includes('--help') || args.includes('-h')) {
    cli.showHelp();
    return;
  }
  
  if (args.length === 0) {
    // Interactive mode
    await cli.createInteractive();
  } else if (args.length >= 2) {
    // Command line mode
    const [word, clue, date] = args;
    await cli.createFromArgs(word, clue, date);
  } else {
    console.error('❌ Invalid arguments. Use --help for usage information.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export default ManualPuzzleCLI;