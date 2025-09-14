#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const readlineSync = require('readline-sync');
const { CrosswordGenerator } = require('./crossword-generator');

class DailyPuzzleCLI {
  constructor() {
    this.puzzleDir = path.join(__dirname, 'daily-puzzles');
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

  getPuzzlePath(dateString = null) {
    const date = dateString || this.getDateString();
    return path.join(this.puzzleDir, `puzzle-${date}.json`);
  }

  async generateDailyPuzzle(dateString = null, useRandomSeed = false) {
    const puzzleDate = dateString || this.getDateString();
    const puzzlePath = this.getPuzzlePath(puzzleDate);

    console.log(chalk.blue('🎯 Generating today\'s Nanowords puzzle...'));
    console.log(chalk.gray(`Date: ${puzzleDate}`));

    try {
      const generator = new CrosswordGenerator();
      if (useRandomSeed) {
        // Use current timestamp for random generation
        generator.setDailySeed(puzzleDate + '-' + Date.now());
        console.log(chalk.yellow('🎲 Using random seed for unique puzzle'));
      } else {
        generator.setDailySeed(puzzleDate);
      }
      
      const puzzle = await generator.generatePuzzle();
      
      // Save puzzle to file
      fs.writeFileSync(puzzlePath, JSON.stringify(puzzle, null, 2));
      
      console.log(chalk.green('✅ Daily puzzle generated successfully!'));
      console.log(chalk.gray(`Saved to: ${puzzlePath}`));
      
      return puzzle;
    } catch (error) {
      console.error(chalk.red('❌ Error generating puzzle:'), error.message);
      throw error;
    }
  }

  loadPuzzle(dateString = null) {
    const puzzlePath = this.getPuzzlePath(dateString);
    
    if (!fs.existsSync(puzzlePath)) {
      throw new Error(`No puzzle found for ${dateString || 'today'}`);
    }

    try {
      const puzzleData = fs.readFileSync(puzzlePath, 'utf8');
      return JSON.parse(puzzleData);
    } catch (error) {
      throw new Error(`Failed to load puzzle: ${error.message}`);
    }
  }

  listAvailablePuzzles() {
    if (!fs.existsSync(this.puzzleDir)) {
      console.log(chalk.yellow('No puzzles directory found.'));
      return [];
    }

    const files = fs.readdirSync(this.puzzleDir)
      .filter(file => file.startsWith('puzzle-') && file.endsWith('.json'))
      .map(file => file.replace('puzzle-', '').replace('.json', ''))
      .sort()
      .reverse(); // Most recent first

    return files;
  }

  displayPuzzle(puzzle) {
    console.log(chalk.cyan.bold('\n📋 NANOWORDS DAILY PUZZLE'));
    console.log(chalk.gray('═'.repeat(50)));
    
    // Display grid
    console.log(chalk.yellow('\n🔢 Grid:'));
    this.displayGrid(puzzle.grid);
    
    // Display clues
    console.log(chalk.yellow('\n📝 Clues:'));
    this.displayClues(puzzle.clues);
    
    console.log(chalk.gray('\n💡 Type "solve" to start solving or "reveal" to see answers'));
  }

  displayGrid(grid) {
    const size = grid.length;
    const border = '┌' + '─'.repeat(size * 4 + 1) + '┐';
    const bottomBorder = '└' + '─'.repeat(size * 4 + 1) + '┘';
    
    console.log(border);
    
    for (let i = 0; i < size; i++) {
      let row = '│';
      for (let j = 0; j < size; j++) {
        const cell = grid[i][j];
        if (cell.isBlack) {
          row += ' ██ ';
        } else {
          const number = cell.number || '';
          const letter = cell.letter || '';
          row += ` ${number}${letter.padEnd(1)} `;
        }
      }
      row += '│';
      console.log(row);
    }
    
    console.log(bottomBorder);
  }

  displayClues(clues) {
    if (clues.across && clues.across.length > 0) {
      console.log(chalk.green('\n➡️  ACROSS:'));
      clues.across.forEach((clue, index) => {
        console.log(chalk.white(`  ${clue.number}. ${clue.clue} (${clue.length})`));
      });
    }

    if (clues.down && clues.down.length > 0) {
      console.log(chalk.green('\n⬇️  DOWN:'));
      clues.down.forEach((clue, index) => {
        console.log(chalk.white(`  ${clue.number}. ${clue.clue} (${clue.length})`));
      });
    }
  }

  async startSolving(puzzle) {
    console.log(chalk.blue('\n🎮 Starting puzzle solver...'));
    console.log(chalk.gray('Commands: [number] [word] to fill, "reveal" to show answers, "quit" to exit'));
    
    const solution = puzzle.solution;
    const userSolution = puzzle.grid.map(row => 
      row.map(cell => cell.isBlack ? '█' : '')
    );

    while (true) {
      console.log(chalk.cyan('\nEnter command:'));
      const input = readlineSync.question('> ').trim().toLowerCase();
      
      if (input === 'quit' || input === 'exit') {
        console.log(chalk.yellow('👋 Thanks for playing!'));
        break;
      }
      
      if (input === 'reveal') {
        this.revealAnswers(puzzle);
        break;
      }
      
      if (input === 'check') {
        this.checkSolution(userSolution, solution);
        continue;
      }
      
      // Parse input: number word (e.g., "1across hello" or "3down world")
      const parts = input.split(' ');
      if (parts.length < 2) {
        console.log(chalk.red('❌ Please enter: [number][direction] [word] (e.g., "1across hello")'));
        continue;
      }
      
      const [clueInput, word] = parts;
      const direction = clueInput.includes('across') || clueInput.includes('a') ? 'across' : 'down';
      const number = parseInt(clueInput.replace(/\D/g, ''));
      
      if (isNaN(number)) {
        console.log(chalk.red('❌ Invalid clue number'));
        continue;
      }
      
      // Find and fill the word
      const filled = this.fillWord(userSolution, puzzle.words, number, direction, word);
      if (filled) {
        console.log(chalk.green(`✅ Filled ${number}${direction} with "${word}"`));
        this.displayCurrentGrid(userSolution);
      } else {
        console.log(chalk.red(`❌ Could not fill ${number}${direction} with "${word}"`));
      }
    }
  }

  fillWord(userSolution, words, number, direction, word) {
    const wordKey = `${number}${direction}`;
    const wordData = words[direction].find(w => w.number === number);
    
    if (!wordData) {
      return false;
    }
    
    if (word.length !== wordData.length) {
      console.log(chalk.red(`❌ Word must be ${wordData.length} letters long`));
      return false;
    }
    
    // Fill the word in the grid
    wordData.positions.forEach((pos, index) => {
      userSolution[pos.row][pos.col] = word[index].toUpperCase();
    });
    
    return true;
  }

  displayCurrentGrid(userSolution) {
    console.log(chalk.yellow('\nCurrent Grid:'));
    const size = userSolution.length;
    
    for (let i = 0; i < size; i++) {
      let row = '';
      for (let j = 0; j < size; j++) {
        const cell = userSolution[i][j];
        if (cell === '█') {
          row += chalk.black('██ ');
        } else if (cell === '') {
          row += chalk.gray('__ ');
        } else {
          row += chalk.white(`${cell} `);
        }
      }
      console.log(row);
    }
  }

  revealAnswers(puzzle) {
    console.log(chalk.blue('\n🔍 REVEALING ANSWERS:'));
    console.log(chalk.gray('═'.repeat(40)));
    
    // Show grid with answers
    this.displayGridWithAnswers(puzzle.grid, puzzle.solution);
    
    // Show word list
    console.log(chalk.yellow('\n📋 All Answers:'));
    this.displayAllAnswers(puzzle.words);
  }

  displayGridWithAnswers(grid, solution) {
    const size = grid.length;
    
    for (let i = 0; i < size; i++) {
      let row = '';
      for (let j = 0; j < size; j++) {
        const cell = grid[i][j];
        if (cell.isBlack) {
          row += chalk.black('██ ');
        } else {
          const letter = solution[i][j] || '';
          row += chalk.green(`${letter} `);
        }
      }
      console.log(row);
    }
  }

  displayAllAnswers(words) {
    if (words.across && words.across.length > 0) {
      console.log(chalk.green('\n➡️  ACROSS:'));
      words.across.forEach(clue => {
        console.log(chalk.white(`  ${clue.number}. ${clue.answer}`));
      });
    }

    if (words.down && words.down.length > 0) {
      console.log(chalk.green('\n⬇️  DOWN:'));
      words.down.forEach(clue => {
        console.log(chalk.white(`  ${clue.number}. ${clue.answer}`));
      });
    }
  }

  checkSolution(userSolution, correctSolution) {
    let correct = 0;
    let total = 0;
    
    for (let i = 0; i < userSolution.length; i++) {
      for (let j = 0; j < userSolution[i].length; j++) {
        if (userSolution[i][j] !== '█') {
          total++;
          if (userSolution[i][j] === correctSolution[i][j]) {
            correct++;
          }
        }
      }
    }
    
    const percentage = Math.round((correct / total) * 100);
    console.log(chalk.blue(`\n📊 Progress: ${correct}/${total} letters correct (${percentage}%)`));
    
    if (correct === total) {
      console.log(chalk.green('🎉 Congratulations! Puzzle completed!'));
    }
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'solve';

    try {
      switch (command) {
        case 'generate':
          const useRandom = args.includes('--random') || args.includes('-r');
          const dateArg = args.find(arg => arg.startsWith('--date='))?.split('=')[1];
          await this.generateDailyPuzzle(dateArg, useRandom);
          break;
          
        case 'solve':
          // Check if puzzle exists, if not generate it
          let puzzle;
          try {
            puzzle = this.loadPuzzle();
            console.log(chalk.blue('📋 Loading today\'s puzzle...'));
          } catch (error) {
            console.log(chalk.yellow('⚠️  No puzzle found for today. Generating new puzzle...'));
            puzzle = await this.generateDailyPuzzle();
          }
          this.displayPuzzle(puzzle);
          await this.startSolving(puzzle);
          break;
          
        case 'show':
          // Check if puzzle exists, if not generate it
          let showPuzzle;
          try {
            showPuzzle = this.loadPuzzle();
            console.log(chalk.blue('📋 Loading today\'s puzzle...'));
          } catch (error) {
            console.log(chalk.yellow('⚠️  No puzzle found for today. Generating new puzzle...'));
            showPuzzle = await this.generateDailyPuzzle();
          }
          this.displayPuzzle(showPuzzle);
          break;
          
        case 'load':
          // Load specific date puzzle
          const loadDateArg = args[1];
          if (!loadDateArg) {
            console.log(chalk.red('❌ Please specify a date (YYYY-MM-DD)'));
            process.exit(1);
          }
          const loadPuzzle = this.loadPuzzle(loadDateArg);
          this.displayPuzzle(loadPuzzle);
          await this.startSolving(loadPuzzle);
          break;
          
        case 'list':
          // List available puzzles
          const availablePuzzles = this.listAvailablePuzzles();
          if (availablePuzzles.length === 0) {
            console.log(chalk.yellow('📭 No puzzles found.'));
            console.log(chalk.gray('Run "npm run generate" to create today\'s puzzle.'));
          } else {
            console.log(chalk.blue('📋 Available Puzzles:'));
            availablePuzzles.forEach((date, index) => {
              const isToday = date === this.getDateString();
              const prefix = isToday ? '🌟' : '📅';
              console.log(chalk.white(`  ${prefix} ${date}${isToday ? ' (today)' : ''}`));
            });
          }
          break;
          
        default:
          console.log(chalk.yellow('📖 Nanowords Daily Puzzle CLI'));
          console.log(chalk.gray('Commands:'));
          console.log(chalk.white('  generate  - Generate today\'s puzzle'));
          console.log(chalk.white('    --random, -r     - Use random seed for unique puzzle'));
          console.log(chalk.white('    --date=YYYY-MM-DD - Generate for specific date'));
          console.log(chalk.white('  solve     - Solve today\'s puzzle (default, auto-generates if missing)'));
          console.log(chalk.white('  show      - Show today\'s puzzle without solving (auto-generates if missing)'));
          console.log(chalk.white('  load [date] - Load puzzle for specific date (YYYY-MM-DD)'));
          console.log(chalk.white('  list      - List all available puzzles'));
          break;
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  const cli = new DailyPuzzleCLI();
  cli.run().catch(error => {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = DailyPuzzleCLI;
