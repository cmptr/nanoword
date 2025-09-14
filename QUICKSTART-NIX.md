# Quick Start Guide (Nix)

## 🚀 Deploy Nanowords to Cloudflare Workers

### 1. Enter Development Environment

```bash
nix develop
```

This installs Node.js 20, Wrangler CLI, and all dependencies automatically.

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Setup KV Namespace

```bash
npm run kv:setup
```

This will create both production and preview namespaces and automatically update `wrangler.toml`.

### 4. Deploy Everything

```bash
# Deploy today's daily puzzle (recommended)
npm run deploy-daily

# Or deploy everything (sample puzzles + full setup)
npm run deploy:full
```

The `deploy-daily` command will:
- Generate today's puzzle
- Upload it to KV
- Deploy to Cloudflare Workers

### 5. Test Your Deployment

Visit your worker URL to see the daily puzzle!

## 🛠️ Development Commands

```bash
# Deploy today's daily puzzle (one command for everything)
npm run deploy-daily

# Generate today's puzzle
npm run generate

# Start local development server
npm run dev-worker

# Test worker functionality
npm run test:worker

# Upload puzzles to KV
npm run kv:populate

# Deploy to Cloudflare
npm run deploy
```

## 📁 Project Structure

- `src/index.js` - Cloudflare Worker script
- `wrangler.toml` - Cloudflare configuration
- `scripts/` - Deployment and utility scripts
- `daily-puzzles/` - Local puzzle storage

## 🔧 Troubleshooting

### Not in Nix Shell
```bash
nix develop
```

### Wrangler Not Found
```bash
# In Nix shell
which wrangler

# Or install globally
npm install -g wrangler
```

### KV Namespace Issues
```bash
wrangler kv:namespace list
npm run kv:create
```

## 📚 Full Documentation

- [Nix Cloudflare Guide](README-NIX-CLOUDFLARE.md) - Complete Nix setup
- [General Cloudflare Guide](README-CLOUDFLARE.md) - Non-Nix setup
- [Daily Puzzle Guide](README-DAILY.md) - Puzzle generation
- [CLI Guide](README-CLI.md) - Command-line usage
