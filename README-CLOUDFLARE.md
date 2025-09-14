# Cloudflare Workers Deployment Guide

This guide explains how to deploy the Nanowords Daily Puzzle application to Cloudflare Workers with KV storage.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install the Cloudflare Workers CLI
3. **Node.js**: Version 14 or higher

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 3. Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window for you to authenticate with your Cloudflare account.

### 4. Create KV Namespace

Create a KV namespace to store the daily puzzles:

```bash
npm run kv:create
```

This will output something like:
```
✅ Successfully created KV namespace with id "abc123def456ghi789"
```

### 5. Update wrangler.toml

Copy the KV namespace ID from the previous step and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PUZZLES"
id = "abc123def456ghi789"  # Replace with your actual namespace ID
preview_id = "xyz789uvw456rst123"  # You'll get this from the preview namespace
```

### 6. Create Preview KV Namespace (Optional)

For local development, create a preview namespace:

```bash
wrangler kv:namespace create PUZZLES --preview
```

Update the `preview_id` in `wrangler.toml` with the preview namespace ID.

### 7. Generate and Upload Puzzles

Generate some daily puzzles and upload them to KV:

```bash
# Generate puzzles for the next few days
npm run generate -- --date=2024-01-15
npm run generate -- --date=2024-01-16
npm run generate -- --date=2024-01-17

# Upload all puzzles to KV
npm run kv:populate
```

### 8. Deploy to Cloudflare Workers

```bash
npm run deploy
```

### 9. Test Your Deployment

Visit your worker URL (provided after deployment) to see the daily puzzle in action!

## Development

### Local Development

To test locally with KV:

```bash
npm run dev-worker
```

This starts a local development server that mimics the Cloudflare Workers environment.

### Adding New Puzzles

1. Generate a new puzzle:
   ```bash
   npm run generate -- --date=YYYY-MM-DD
   ```

2. Upload to KV:
   ```bash
   npm run kv:populate
   ```

3. Deploy changes:
   ```bash
   npm run deploy
   ```

## Project Structure

```
nanowords/
├── src/
│   └── index.js              # Main Cloudflare Worker script
├── scripts/
│   └── populate-kv.js        # Script to upload puzzles to KV
├── daily-puzzles/            # Local puzzle storage
├── wrangler.toml             # Cloudflare Workers configuration
└── package.json              # Dependencies and scripts
```

## How It Works

1. **Single Route**: The worker only serves content at the root path (`/`)
2. **Daily Puzzles**: Each day, the worker looks for a puzzle with key `puzzle-YYYY-MM-DD`
3. **Auto-Generation**: If no puzzle exists for today, the worker generates one and stores it in KV
4. **Caching**: Puzzles are cached for 1 hour to improve performance
5. **Timezone**: Uses America/Chicago timezone for consistent daily puzzle generation

## Available Scripts

- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run dev-worker` - Start local development server
- `npm run kv:create` - Create KV namespace
- `npm run kv:populate` - Upload existing puzzles to KV
- `npm run kv:list` - List KV contents
- `npm run generate` - Generate a new daily puzzle

## Troubleshooting

### KV Namespace Issues

If you get KV namespace errors:

1. Check that your `wrangler.toml` has the correct namespace ID
2. Verify you're authenticated: `wrangler whoami`
3. Try recreating the namespace: `wrangler kv:namespace delete PUZZLES`

### Deployment Issues

If deployment fails:

1. Check your `wrangler.toml` syntax
2. Verify all required fields are present
3. Check Cloudflare dashboard for error logs

### Local Development Issues

If local development doesn't work:

1. Make sure you have a preview KV namespace configured
2. Check that `wrangler dev` is running
3. Verify your worker script syntax

## Customization

### Changing the Puzzle Generation

Edit `src/index.js` and modify the `generateDailyPuzzle()` function to use your own puzzle generation logic.

### Styling

The HTML and CSS are embedded in the worker script. Modify the `generateHTML()` function to change the appearance.

### Adding Routes

To add more routes, modify the main `fetch` handler in `src/index.js`.

## Performance Considerations

- Puzzles are cached for 1 hour to reduce KV reads
- The worker generates puzzles on-demand if they don't exist
- Consider pre-generating puzzles for better performance
- KV has eventual consistency, so new puzzles might take a few minutes to be available globally

## Security

- The worker is publicly accessible
- No authentication is required
- Consider adding rate limiting if needed
- KV data is automatically encrypted at rest

## Monitoring

Check your Cloudflare Workers dashboard for:
- Request metrics
- Error logs
- Performance data
- KV usage statistics
