{
  description = "Nanowords Daily Crossword Puzzle Generator";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Node.js version
        nodejs = pkgs.nodejs_20;
        
        # Create a package.json if it doesn't exist or use existing one
        packageJson = {
          name = "nanowords-daily";
          version = "1.0.0";
          description = "Daily crossword puzzle generator CLI";
          main = "daily-puzzle.js";
          bin = {
            "nanowords-daily" = "./daily-puzzle.js";
          };
          scripts = {
            start = "node daily-puzzle.js";
            generate = "node daily-puzzle.js generate";
            solve = "node daily-puzzle.js solve";
            demo = "node example-usage.js";
            dev = "node index.js";
            "dev-refactored" = "node refactoredIndex.js";
            serve = "node serve-daily.js";
            deploy = "wrangler deploy";
            "dev-worker" = "wrangler dev";
            "kv:create" = "wrangler kv:namespace create PUZZLES";
            "kv:list" = "wrangler kv:key list --namespace-id=PUZZLES";
            "kv:populate" = "node scripts/populate-kv.js populate";
            "kv:list-contents" = "node scripts/populate-kv.js list";
            "test:worker" = "node scripts/test-worker.js";
            "deploy:full" = "./scripts/deploy.sh";
            "deploy-daily" = "node scripts/deploy-daily.js";
          };
          keywords = [ "crossword" "puzzle" "daily" "cli" ];
          author = "";
          license = "MIT";
          dependencies = {
            "node-fetch" = "^3.3.0";
            "chalk" = "^4.1.2";
            "readline-sync" = "^1.4.10";
          };
          devDependencies = {
            "wrangler" = "^4.0.0";
          };
          engines = {
            node = ">=14.0.0";
          };
        };
        
        # Simple package.json for dependencies
        packageJsonFile = pkgs.writeText "package.json" (builtins.toJSON packageJson);
        
        # Development shell
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            nodePackages.npm
            nodePackages.node2nix
            # Cloudflare Workers tools
            nodePackages.wrangler
            # Additional development tools
            git
            curl
            jq
            # For web development
            python3
            nodePackages.http-server
          ];
          
          shellHook = ''
            echo "🧩 Nanowords Development Environment"
            echo "=================================="
            echo ""
            echo "Available commands:"
            echo "  npm run dev           - Run web version (index.js)"
            echo "  npm run dev-refactored - Run web version (refactoredIndex.js)"
            echo "  npm run generate      - Generate daily puzzle"
            echo "  npm run solve         - Solve daily puzzle"
            echo "  npm run demo          - Run demo"
            echo "  npm run serve         - Serve daily puzzle web app"
            echo "  npm install           - Install dependencies"
            echo ""
            echo "Cloudflare Workers commands:"
            echo "  npm run dev-worker    - Start local Cloudflare Worker dev server"
            echo "  npm run deploy        - Deploy to Cloudflare Workers"
            echo "  npm run kv:create     - Create KV namespace"
            echo "  npm run kv:populate   - Upload puzzles to KV"
            echo "  npm run test:worker   - Test worker functionality"
            echo ""
            echo "Web server commands:"
            echo "  python3 -m http.server 8000  - Serve web version"
            echo ""
            echo "Node.js version: $(node --version)"
            echo "NPM version: $(npm --version)"
            echo ""
            
            # Create daily-puzzles directory if it doesn't exist
            mkdir -p daily-puzzles
            
            # Set up environment variables
            export NODE_ENV=development
            export PUZZLE_DIR=$(pwd)/daily-puzzles
            
            # Check if node_modules exists
            if [ ! -d "node_modules" ]; then
              echo "⚠️  node_modules not found. Run 'npm install' to install dependencies."
            fi
          '';
        };
        
        # Package the CLI application
        nanowords-cli = pkgs.stdenv.mkDerivation {
          pname = "nanowords-daily";
          version = "1.0.0";
          src = ./.;
          
          buildInputs = [ nodejs ];
          
          installPhase = ''
            mkdir -p $out/bin
            mkdir -p $out/share/nanowords
            
            # Copy all source files
            cp -r *.js *.html *.css *.json $out/share/nanowords/
            cp -r daily-puzzles $out/share/nanowords/ 2>/dev/null || true
            
            # Create executable wrapper
            cat > $out/bin/nanowords-daily << 'EOF'
            #!/bin/sh
            cd $out/share/nanowords
            exec ${nodejs}/bin/node daily-puzzle.js "$@"
            EOF
            chmod +x $out/bin/nanowords-daily
            
            # Create additional wrapper scripts
            cat > $out/bin/nanowords-generate << 'EOF'
            #!/bin/sh
            cd $out/share/nanowords
            exec ${nodejs}/bin/node daily-puzzle.js generate "$@"
            EOF
            chmod +x $out/bin/nanowords-generate
            
            cat > $out/bin/nanowords-solve << 'EOF'
            #!/bin/sh
            cd $out/share/nanowords
            exec ${nodejs}/bin/node daily-puzzle.js solve "$@"
            EOF
            chmod +x $out/bin/nanowords-solve
          '';
          
          meta = with pkgs.lib; {
            description = "Daily crossword puzzle generator CLI";
            homepage = "https://github.com/yourusername/nanowords";
            license = licenses.mit;
            maintainers = [ ];
            platforms = platforms.all;
          };
        };
        
        # Web application package
        nanowords-web = pkgs.stdenv.mkDerivation {
          pname = "nanowords-web";
          version = "1.0.0";
          src = ./.;
          
          installPhase = ''
            mkdir -p $out
            cp *.html *.css *.js *.json *.jfif $out/ 2>/dev/null || true
            
            # Create a simple server script
            cat > $out/serve.sh << 'EOF'
            #!/bin/sh
            echo "🌐 Starting Nanowords Web Server..."
            echo "Open http://localhost:8000 in your browser"
            ${pkgs.python3}/bin/python3 -m http.server 8000
            EOF
            chmod +x $out/serve.sh
          '';
          
          meta = with pkgs.lib; {
            description = "Nanowords web-based crossword puzzle";
            homepage = "https://github.com/yourusername/nanowords";
            license = licenses.mit;
            maintainers = [ ];
            platforms = platforms.all;
          };
        };
        
      in
      {
        # Development shell
        devShells.default = devShell;
        
        # Packages
        packages = {
          default = nanowords-cli;
          cli = nanowords-cli;
          web = nanowords-web;
        };
        
        # Apps (runnable commands)
        apps = {
          generate = {
            type = "app";
            program = "${nanowords-cli}/bin/nanowords-generate";
          };
          solve = {
            type = "app";
            program = "${nanowords-cli}/bin/nanowords-solve";
          };
          daily = {
            type = "app";
            program = "${nanowords-cli}/bin/nanowords-daily";
          };
        };
        
        
        # Checks
        checks = {
          # Check that the CLI builds successfully
          build = nanowords-cli;
          
          # Check that the web version builds
          web-build = nanowords-web;
        };
      });
}
