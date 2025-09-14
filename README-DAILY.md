# Nanowords Daily Puzzle - Web Version

A web-based daily crossword puzzle that loads the same puzzle for all users each day.

## Quick Start

1. **Generate today's puzzle:**
   ```bash
   npm run generate
   ```

2. **Serve the web version:**
   ```bash
   npm run serve
   ```

3. **Open in browser:**
   ```
   http://localhost:8080/daily
   ```

## Features

- 🎯 **Daily Consistency**: Same puzzle for all users on the same day
- 🎮 **Interactive Solving**: Click cells to enter letters
- ⏱️ **Timer**: Tracks solving time
- ✅ **Solution Checking**: Check your progress
- 🔍 **Answer Reveal**: Show all answers
- 📱 **Responsive Design**: Works on desktop and mobile

## How It Works

1. **Puzzle Generation**: The CLI generates a puzzle and saves it as `daily-puzzles/puzzle-YYYY-MM-DD.json`
2. **Web Loading**: The HTML page loads the JSON file for today's date
3. **Interactive Solving**: Users can click cells and type letters
4. **Progress Tracking**: Timer and solution checking

## File Structure

```
nanowords/
├── daily-puzzle.html     # Web interface for daily puzzle
├── serve-daily.js        # Simple HTTP server
├── daily-puzzles/        # Generated puzzle storage
│   └── puzzle-2024-01-15.json
├── crossword-generator.js # Puzzle generation logic
└── style.css            # Shared styling
```

## API Endpoints

- `GET /daily` - Daily puzzle web interface
- `GET /puzzle` - Today's puzzle JSON data
- `GET /daily-puzzles/puzzle-YYYY-MM-DD.json` - Specific date puzzle

## Usage Examples

### Generate and Serve
```bash
# Generate today's puzzle
npm run generate

# Start web server
npm run serve

# Open browser to http://localhost:8080/daily
```

### Development Workflow
```bash
# 1. Generate puzzle for today
npm run generate

# 2. Start server
npm run serve

# 3. Open browser and solve
# 4. Check solution or reveal answers
```

## Web Interface Features

### Controls
- **Check**: Verify your current progress
- **Reveal**: Show all answers
- **Clear**: Clear all user input

### Interaction
- **Click cells** to select them
- **Type letters** to fill cells
- **Backspace** to delete and move to previous cell
- **Timer** automatically starts when puzzle loads

### Visual Feedback
- **Green border**: Correct letters
- **Red border**: Incorrect letters
- **Completion message**: When puzzle is solved

## Customization

### Styling
Edit `style.css` to customize the appearance:
- Grid colors and borders
- Button styles
- Typography
- Layout and spacing

### Puzzle Settings
Modify `crossword-generator.js` to change:
- Grid size (currently 5x5)
- Difficulty settings
- Word filtering criteria
- Fallback word lists

## Deployment

### Static Hosting
1. Generate puzzles: `npm run generate`
2. Upload files to web server:
   - `daily-puzzle.html`
   - `style.css`
   - `daily-puzzles/` directory
3. Configure server to serve JSON files with proper CORS headers

### Server Requirements
- Serve static files
- Enable CORS for JSON files
- Handle `/daily-puzzles/puzzle-*.json` routes

## Browser Compatibility

- Modern browsers with ES6 support
- jQuery 3.6.0+ (included via CDN)
- Fetch API support

## Troubleshooting

**"Puzzle not found" error:**
- Run `npm run generate` first
- Check that `daily-puzzles/puzzle-YYYY-MM-DD.json` exists

**CORS errors:**
- Use the included server (`npm run serve`)
- Or configure your web server for CORS

**Styling issues:**
- Ensure `style.css` is accessible
- Check browser developer console for errors

## Development

### Local Development
```bash
# Enter Nix development environment
nix develop

# Install dependencies
npm install

# Generate puzzle
npm run generate

# Serve web version
npm run serve
```

### Testing
- Generate puzzles for different dates
- Test on different screen sizes
- Verify timer functionality
- Check solution validation
