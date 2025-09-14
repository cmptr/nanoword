# Nanowords Nix Development Environment

This project includes a complete Nix flake setup for reproducible development and deployment of the Nanowords crossword puzzle generator.

## Quick Start

### Prerequisites
- [Nix](https://nixos.org/download.html) installed on your system
- [direnv](https://direnv.net/) (optional, for automatic environment activation)

### Development Setup

1. **Clone and enter the project:**
   ```bash
   cd nanowords
   ```

2. **Enter the development shell:**
   ```bash
   nix develop
   # or if you have direnv installed:
   direnv allow
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start developing:**
   ```bash
   # Web version
   npm run dev-refactored
   
   # CLI version
   npm run generate
   npm run solve
   
   # Serve web version
   python3 -m http.server 8000
   ```

## Available Commands

### Development Commands
```bash
# Enter development environment
nix develop

# Install dependencies
npm install

# Run web version (refactored)
npm run dev-refactored

# Run web version (original)
npm run dev

# Generate daily puzzle
npm run generate

# Solve daily puzzle
npm run solve

# Run demo
npm run demo
```

### Nix Commands
```bash
# Build CLI package
nix build

# Build web package
nix build .#web

# Run CLI app directly
nix run .#generate
nix run .#solve
nix run .#daily

# Enter development shell
nix develop

# Check if everything builds
nix flake check
```

### Package Installation
```bash
# Install to your Nix profile
nix profile install

# Or install system-wide (on NixOS)
nix-env -iA nixpkgs.nanowords-daily
```

## Project Structure

```
nanowords/
├── flake.nix              # Nix flake configuration
├── .envrc                 # direnv configuration
├── .gitignore            # Git ignore rules
├── package.json          # Node.js dependencies
├── daily-puzzle.js       # CLI application
├── crossword-generator.js # Core puzzle logic
├── index.html            # Web interface
├── index.js              # Original web logic (10x10)
├── refactoredIndex.js    # Refactored web logic (5x5)
├── style.css             # Web styling
├── daily-puzzles/        # Generated puzzle storage
└── README*.md           # Documentation
```

## Features

### 🔧 Development Environment
- **Node.js 20**: Latest LTS version
- **NPM**: Package management
- **Python 3**: For serving web version
- **Additional tools**: git, curl, jq, http-server

### 📦 Packaging
- **CLI Package**: Standalone executable with all dependencies
- **Web Package**: Static files ready for deployment
- **Node Modules**: Isolated dependency management

### 🚀 Deployment
- **Reproducible builds**: Same result on any Nix-supported system
- **Standalone executables**: No external dependencies needed
- **System integration**: Installable via Nix package manager

## Environment Variables

The development environment sets these variables:
- `NODE_ENV=development`
- `PUZZLE_DIR=$PWD/daily-puzzles`

## Dependencies

### Runtime Dependencies
- `node-fetch`: HTTP requests for word API
- `chalk`: Terminal colors and styling
- `readline-sync`: Interactive user input

### Development Dependencies
- `node2nix`: Convert package.json to Nix expressions
- `http-server`: Local development server

## Building for Production

### CLI Application
```bash
# Build standalone CLI
nix build

# The result will be in ./result/bin/nanowords-daily
./result/bin/nanowords-daily generate
./result/bin/nanowords-daily solve
```

### Web Application
```bash
# Build web package
nix build .#web

# Files will be in ./result/
# Serve with any static file server
```

## Cross-Platform Support

The flake supports all platforms that Nix supports:
- Linux (x86_64, aarch64)
- macOS (x86_64, aarch64)
- Windows (via WSL or native)

## Troubleshooting

### Common Issues

**"hash mismatch" errors:**
```bash
# Update the npmDepsHash in flake.nix
nix develop --impure
npm install
nix-prefetch-git . > hash.txt
# Copy the hash from the output
```

**"command not found" after installation:**
```bash
# Refresh your shell environment
hash -r
# or restart your terminal
```

**direnv not working:**
```bash
# Make sure direnv is installed and configured
direnv allow
# Check if direnv is in your shell config
```

### Development Tips

1. **Use direnv**: Automatically activates the environment when entering the directory
2. **Check builds**: Run `nix flake check` to verify everything works
3. **Clean builds**: Use `nix build --rebuild` for clean builds
4. **Debug issues**: Use `nix develop --impure` for debugging

## Contributing

1. Make changes to the code
2. Test in development environment: `nix develop`
3. Verify build: `nix build`
4. Run checks: `nix flake check`
5. Commit changes

## Advanced Usage

### Custom Node.js Version
Edit `flake.nix` and change:
```nix
nodejs = pkgs.nodejs_20;  # Change to nodejs_18, nodejs_19, etc.
```

### Additional Development Tools
Add to `buildInputs` in the `devShell`:
```nix
buildInputs = with pkgs; [
  nodejs
  nodePackages.npm
  # Add more tools here
  vscode
  git
  # ...
];
```

### Custom Package Configuration
Modify the `packageJson` section in `flake.nix` to add more scripts or dependencies.

## License

MIT License - see LICENSE file for details.
