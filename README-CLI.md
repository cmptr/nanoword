# Nanowords Daily Puzzle CLI

A command-line crossword puzzle generator that creates a single daily puzzle for all users to solve.

## Features

- 🎯 **Daily Puzzles**: Same puzzle for all users on the same day
- 🎮 **Interactive Solver**: Solve puzzles directly in the terminal
- 🎨 **Colorful Output**: Beautiful terminal display with colors
- 💾 **Persistent Storage**: Puzzles saved locally for offline solving
- 🔄 **Deterministic Generation**: Uses date-based seeding for consistency

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make the CLI executable (optional):
```bash
chmod +x daily-puzzle.js
```

## Usage

### Generate Today's Puzzle
```bash
npm run generate
# or
node daily-puzzle.js generate
```

### Solve Today's Puzzle
```bash
npm run solve
# or
node daily-puzzle.js solve
```

### Show Puzzle Without Solving
```bash
node daily-puzzle.js show
```

### Help
```bash
node daily-puzzle.js
```

## How to Solve

1. **View the Grid**: The puzzle displays a 5x5 grid with numbered squares
2. **Read the Clues**: Across and Down clues are shown with their lengths
3. **Fill Words**: Use the format `[number][direction] [word]`
   - Example: `1across hello` or `3down world`
4. **Commands**:
   - `check` - Check your progress
   - `reveal` - Show all answers
   - `quit` - Exit the solver

## Example Session

```
🎯 Generating today's Nanowords puzzle...
Date: 2024-01-15
✅ Daily puzzle generated successfully!

📋 NANOWORDS DAILY PUZZLE
══════════════════════════════════════════════════

🔢 Grid:
┌─────────────────────┐
│ 1  2  3  ██ 4  │
│ 5  __ __ __ __ │
│ 6  __ __ __ __ │
│ ██ __ __ __ __ │
│ 7  __ __ __ __ │
└─────────────────────┘

📝 Clues:
➡️  ACROSS:
  1. A common greeting (5)
  2. Opposite of down (2)
  3. A feline pet (3)
  4. Large body of water (3)

⬇️  DOWN:
  1. Feeling of joy (5)
  2. To perceive with eyes (3)
  3. Part of body (3)
  5. Frozen water (3)

💡 Type "solve" to start solving or "reveal" to see answers

Enter command:
> 1across hello
✅ Filled 1across with "hello"

Current Grid:
H E L L O
__ __ __ __ __
__ __ __ __ __
██ __ __ __ __
__ __ __ __ __

Enter command:
> reveal
🔍 REVEALING ANSWERS:
════════════════════════════════════════════════

H E L L O
U P C A T
S E A __ __
██ __ __ __ __
I C E __ __ __
```

## File Structure

- `daily-puzzle.js` - Main CLI application
- `crossword-generator.js` - Core puzzle generation logic
- `daily-puzzles/` - Directory containing saved puzzles
- `package.json` - Dependencies and scripts

## Daily Puzzle System

Each day, the puzzle generator uses the current date as a seed, ensuring:
- Same puzzle for all users on the same day
- Different puzzle each day
- Reproducible results for testing

## Dependencies

- `node-fetch` - HTTP requests to word API
- `chalk` - Terminal colors and styling
- `readline-sync` - Interactive user input

## Customization

You can modify the puzzle generation by editing `crossword-generator.js`:
- Change grid size (currently 5x5)
- Adjust difficulty settings
- Modify word filtering criteria
- Add new fallback word lists

## Troubleshooting

**"No puzzle found for today"**
- Run `npm run generate` first to create today's puzzle

**"API call failed"**
- The app will use fallback words if the API is unavailable
- Check your internet connection

**Puzzle seems too easy/hard**
- Modify the `commonLetters` array in `crossword-generator.js`
- Adjust the black square generation probability
