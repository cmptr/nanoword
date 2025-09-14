#!/usr/bin/env node

/**
 * Setup script for Cloudflare KV namespace
 * Creates namespace and updates wrangler.toml
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class KVSetup {
  constructor() {
    this.wranglerConfigPath = path.join(__dirname, '..', 'wrangler.toml');
  }

  async createNamespace() {
    console.log('🚀 Creating Cloudflare KV namespace...');
    
    try {
      const output = execSync('wrangler kv:namespace create PUZZLES', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('✅ KV namespace created successfully');
      console.log(output);
      
      // Extract namespace ID from output
      const idMatch = output.match(/id\s*=\s*"([^"]+)"/);
      if (idMatch) {
        const namespaceId = idMatch[1];
        console.log(`📋 Namespace ID: ${namespaceId}`);
        return namespaceId;
      } else {
        console.log('⚠️  Could not extract namespace ID from output');
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating KV namespace:', error.message);
      return null;
    }
  }

  async createPreviewNamespace() {
    console.log('🚀 Creating Cloudflare KV preview namespace...');
    
    try {
      const output = execSync('wrangler kv:namespace create PUZZLES --preview', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('✅ KV preview namespace created successfully');
      console.log(output);
      
      // Extract preview namespace ID from output
      const idMatch = output.match(/id\s*=\s*"([^"]+)"/);
      if (idMatch) {
        const previewNamespaceId = idMatch[1];
        console.log(`📋 Preview Namespace ID: ${previewNamespaceId}`);
        return previewNamespaceId;
      } else {
        console.log('⚠️  Could not extract preview namespace ID from output');
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating KV preview namespace:', error.message);
      return null;
    }
  }

  updateWranglerConfig(namespaceId, previewNamespaceId) {
    console.log('📝 Updating wrangler.toml...');
    
    try {
      let config = fs.readFileSync(this.wranglerConfigPath, 'utf8');
      
      // Update the namespace ID
      if (namespaceId) {
        config = config.replace(
          /id\s*=\s*"[^"]*"/,
          `id = "${namespaceId}"`
        );
      }
      
      // Update the preview namespace ID
      if (previewNamespaceId) {
        config = config.replace(
          /preview_id\s*=\s*"[^"]*"/,
          `preview_id = "${previewNamespaceId}"`
        );
      }
      
      fs.writeFileSync(this.wranglerConfigPath, config);
      console.log('✅ wrangler.toml updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating wrangler.toml:', error.message);
    }
  }

  async listNamespaces() {
    console.log('📋 Listing existing KV namespaces...');
    
    try {
      execSync('wrangler kv:namespace list', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Error listing namespaces:', error.message);
    }
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'create';

    try {
      switch (command) {
        case 'create':
          // Create both production and preview namespaces
          const namespaceId = await this.createNamespace();
          const previewNamespaceId = await this.createPreviewNamespace();
          
          if (namespaceId || previewNamespaceId) {
            this.updateWranglerConfig(namespaceId, previewNamespaceId);
            console.log('\n🎉 KV setup complete!');
            console.log('\nNext steps:');
            console.log('1. Generate puzzles: npm run generate');
            console.log('2. Upload to KV: npm run kv:populate');
            console.log('3. Deploy: npm run deploy');
          }
          break;
          
        case 'list':
          await this.listNamespaces();
          break;
          
        case 'update-config':
          const prodId = args[1];
          const previewId = args[2];
          if (!prodId) {
            console.log('❌ Please provide namespace ID: node setup-kv.js update-config <namespace-id> [preview-id]');
            process.exit(1);
          }
          this.updateWranglerConfig(prodId, previewId);
          break;
          
        default:
          console.log('Usage: node setup-kv.js [create|list|update-config]');
          console.log('  create        - Create new KV namespaces and update config');
          console.log('  list          - List existing namespaces');
          console.log('  update-config - Update wrangler.toml with provided IDs');
          break;
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const setup = new KVSetup();
  setup.run();
}

module.exports = KVSetup;
