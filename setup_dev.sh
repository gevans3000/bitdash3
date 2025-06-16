#!/usr/bin/env bash
# setup_dev.sh – prepare the BitDash3 development environment

set -euo pipefail

# Always run from this script's directory so npm commands target the repo root
cd "$(dirname "$0")"

# 1. Ensure Node.js and npm are available
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "Node.js and npm are required. Please install them before continuing." >&2
  exit 1
fi

# 2. Optionally use .nvmrc if present
if [[ -f ".nvmrc" ]]; then
  if command -v nvm >/dev/null; then
    nvm install "$(cat .nvmrc)"
    nvm use "$(cat .nvmrc)"
  else
    echo ".nvmrc found but nvm is not installed. Consider installing nvm to manage Node versions." >&2
  fi
fi

# 3. Install dependencies
echo "Installing node modules…"
npm install

# 4. Run lint and unit tests
echo "Running lint and tests…"
npm run lint
npm test

# 5. Build the project
echo "Building project…"
npm run build

echo "Setup complete. Start the development server with: npm run dev"
