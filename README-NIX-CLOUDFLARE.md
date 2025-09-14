# Cloudflare Workers Deployment Guide (Nix)

This guide explains how to deploy the Nanowords Daily Puzzle application to Cloudflare Workers using Nix for package management.

## Prerequisites

1. **Nix with Flakes**: Ensure you have Nix with flakes enabled
2. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
3. **Git**: For cloning and version control

## Quick Start

### 1. Enter the Development Environment

```bash
# Enter the Nix development shell
nix develop

# Or if you prefer nix-shell
nix-shell
```

This will automatically:
- Install Node.js 20, npm, and Wrangler CLI
- Set up the development environment
- Create necessary directories
- Show available commands

### 2. Install Dependencies

```bash
npm install
```

### 3. Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

### 4. Create KV Namespace

```bash
npm run kv:create
```

Copy the namespace ID from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PUZZLES"
id = "your-namespace-id-here"
preview_id = "your-preview-namespace-id-here"
```

### 5. Generate and Deploy

```bash
# Generate today's puzzle
npm run generate

# Upload to KV
npm run kv:populate

# Deploy to Cloudflare Workers
npm run deploy
```

## Development Workflow

### Local Development

```bash
# Start the Nix development shell
nix develop

# Start local Cloudflare Worker development server
npm run dev-worker

# In another terminal, test the worker
npm run test:worker
```

### Generate Puzzles

```bash
# Generate today's puzzle
npm run generate

# Generate puzzle for specific date
npm run generate -- --date=2024-01-15

# Generate with random seed
npm run generate -- --random
```

### Upload to KV

```bash
# Upload all existing puzzles
npm run kv:populate

# List KV contents
npm run kv:list
```

### Deploy

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Or use the automated deployment script
npm run deploy:full
```

## Nix-Specific Features

### Development Shell

The Nix flake provides a complete development environment with:

- **Node.js 20**: Latest LTS version
- **Wrangler CLI**: Cloudflare Workers tooling
- **Development Tools**: git, curl, jq, python3
- **Automatic Setup**: Creates directories and sets environment variables

### Available Nix Commands

```bash
# Enter development shell
nix develop

# Build the CLI package
nix build .#cli

# Build the web package
nix build .#web

# Run the CLI directly
nix run .#daily
nix run .#generate
nix run .#solve

# Check that everything builds
nix flake check
```

### Package Structure

The flake provides three main packages:

1. **CLI Package** (`.packages.cli`): Command-line crossword generator
2. **Web Package** (`.packages.web`): Web-based puzzle interface
3. **Development Shell** (`.devShells.default`): Complete development environment

## Project Structure

```
nanowords/
├── flake.nix                    # Nix configuration
├── flake.lock                   # Nix lock file
├── src/
│   └── index.js                 # Cloudflare Worker script
├── scripts/
│   ├── populate-kv.js          # KV upload script
│   ├── test-worker.js          # Worker test script
│   └── deploy.sh               # Deployment script
├── daily-puzzles/              # Local puzzle storage
├── wrangler.toml               # Cloudflare Workers config
└── package.json                # Node.js dependencies
```

## Configuration Files

### wrangler.toml

```toml
name = "nanowords-daily"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
name = "nanowords-daily"

[[kv_namespaces]]
binding = "PUZZLES"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

[build]
command = ""

[site]
bucket = "public"
```

### flake.nix

The Nix flake includes:
- Node.js 20 with npm
- Wrangler CLI for Cloudflare Workers
- Development tools (git, curl, jq, python3)
- Automatic environment setup
- Package definitions for CLI and web versions

## Troubleshooting

### Nix Issues

```bash
# Update the flake lock
nix flake update

# Clean build cache
nix-collect-garbage

# Rebuild from scratch
nix develop --rebuild
```

### Cloudflare Issues

```bash
# Check authentication
wrangler whoami

# List KV namespaces
wrangler kv:namespace list

# Check worker logs
wrangler tail
```

### Development Issues

```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Reset KV namespace
wrangler kv:namespace delete PUZZLES
npm run kv:create
```

## Advanced Usage

### Custom Nix Configuration

You can override the Node.js version or add additional packages by modifying `flake.nix`:

```nix
# Use different Node.js version
nodejs = pkgs.nodejs_18;

# Add additional packages
buildInputs = with pkgs; [
  nodejs
  nodePackages.npm
  nodePackages.wrangler
  # Add your packages here
  pkgs.your-package
];
```

### Multiple Environments

Create different configurations for development, staging, and production:

```bash
# Development
nix develop

# Staging (if you create a staging flake output)
nix develop .#staging

# Production build
nix build .#production
```

### CI/CD Integration

Use the Nix flake in your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Setup Nix
  uses: cachix/install-nix-action@v20

- name: Enter development shell
  run: nix develop --command npm run deploy
```

## Performance Tips

1. **Use Nix Cache**: Set up a Nix cache for faster builds
2. **Incremental Builds**: Nix will only rebuild changed dependencies
3. **Development Shell**: Use `nix develop` for consistent environments
4. **Lock File**: Commit `flake.lock` for reproducible builds

## Security

- All dependencies are managed by Nix
- No global package installation required
- Reproducible builds across different systems
- Isolated development environment

## Monitoring

After deployment, monitor your worker:

1. **Cloudflare Dashboard**: Check metrics and logs
2. **Wrangler CLI**: Use `wrangler tail` for real-time logs
3. **KV Usage**: Monitor storage usage in the dashboard
4. **Performance**: Check response times and error rates

## Next Steps

1. **Custom Domain**: Set up a custom domain in Cloudflare
2. **Analytics**: Add analytics tracking
3. **Rate Limiting**: Implement rate limiting if needed
4. **Monitoring**: Set up alerts for errors
5. **Backup**: Regular KV backups for puzzle data
