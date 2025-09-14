#!/bin/bash

# Cloudflare Workers Deployment Script for Nanowords Daily Puzzle (Nix)
# This script automates the entire deployment process

set -e  # Exit on any error

echo "🚀 Starting Nanowords Cloudflare Workers deployment (Nix)..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a Nix development shell
if [ -z "$IN_NIX_SHELL" ]; then
    print_warning "Not in a Nix development shell. Please run:"
    echo "nix develop"
    echo ""
    print_status "Or if you prefer to continue without Nix:"
    echo "npm install -g wrangler"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not available. Please:"
    echo "1. Enter Nix development shell: nix develop"
    echo "2. Or install globally: npm install -g wrangler"
    exit 1
fi

# Check if user is authenticated
if ! wrangler whoami &> /dev/null; then
    print_warning "Not authenticated with Cloudflare. Please run:"
    echo "wrangler login"
    exit 1
fi

print_success "Wrangler CLI is available and authenticated"

# Check if we need to install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
else
    print_success "Dependencies already installed"
fi

# Check if KV namespace exists
print_status "Checking KV namespace..."
if ! wrangler kv:namespace list | grep -q "PUZZLES"; then
    print_status "Setting up KV namespace..."
    npm run kv:setup
    
    if [ $? -ne 0 ]; then
        print_error "Failed to setup KV namespace"
        exit 1
    fi
    
    print_success "KV namespace setup complete"
else
    print_success "KV namespace already exists"
fi

# Generate some sample puzzles
print_status "Generating sample puzzles..."
if [ ! -d "daily-puzzles" ]; then
    mkdir -p daily-puzzles
fi

# Generate puzzles for the next 7 days
for i in {0..6}; do
    DATE=$(date -d "+$i days" +%Y-%m-%d)
    print_status "Generating puzzle for $DATE..."
    npm run generate -- --date="$DATE" --random || true
done

# Upload puzzles to KV
print_status "Uploading puzzles to KV..."
npm run kv:populate

# Deploy to Cloudflare Workers
print_status "Deploying to Cloudflare Workers..."
npm run deploy

print_success "Deployment complete! 🎉"
echo ""
print_status "Your Nanowords Daily Puzzle is now live!"
echo ""
print_status "Next steps:"
echo "1. Visit your worker URL to test the puzzle"
echo "2. Set up a custom domain if desired"
echo "3. Configure any additional settings in the Cloudflare dashboard"
echo ""
print_status "To update puzzles in the future:"
echo "1. Generate new puzzles: npm run generate"
echo "2. Upload to KV: npm run kv:populate"
echo "3. Deploy: npm run deploy"
