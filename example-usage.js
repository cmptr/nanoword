#!/usr/bin/env node

const DailyPuzzleCLI = require('./daily-puzzle');
const chalk = require('chalk');

async function demonstrateCLI() {
  console.log(chalk.blue.bold('🚀 Nanowords Daily Puzzle CLI Demo'));
  console.log(chalk.gray('═'.repeat(50)));
  
  const cli = new DailyPuzzleCLI();
  
  try {
    // Generate today's puzzle
    console.log(chalk.yellow('\n📝 Step 1: Generating today\'s puzzle...'));
    const puzzle = await cli.generateDailyPuzzle();
    
    // Display the puzzle
    console.log(chalk.yellow('\n📋 Step 2: Displaying the puzzle...'));
    cli.displayPuzzle(puzzle);
    
    // Show how to solve a few words programmatically
    console.log(chalk.yellow('\n🎮 Step 3: Demonstrating solving...'));
    
    if (puzzle.clues.across.length > 0) {
      const firstAcross = puzzle.clues.across[0];
      console.log(chalk.green(`\nSolving: ${firstAcross.number}across - "${firstAcross.answer}"`));
    }
    
    if (puzzle.clues.down.length > 0) {
      const firstDown = puzzle.clues.down[0];
      console.log(chalk.green(`\nSolving: ${firstDown.number}down - "${firstDown.answer}"`));
    }
    
    // Show final solution
    console.log(chalk.yellow('\n🔍 Step 4: Showing complete solution...'));
    cli.revealAnswers(puzzle);
    
    console.log(chalk.blue('\n✨ Demo complete! Try running:'));
    console.log(chalk.white('  npm run solve    - Interactive solving mode'));
    console.log(chalk.white('  npm run generate - Generate a new puzzle'));
    
  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error.message);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateCLI();
}
