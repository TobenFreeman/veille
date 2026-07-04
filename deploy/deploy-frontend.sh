#!/usr/bin/env bash
# Build le front React et le publie dans /var/www/veille.
set -euo pipefail
cd "$(dirname "$0")/../frontend"

echo "→ Build du front…"
npm run build

echo "→ Publication vers /var/www/veille…"
sudo rsync -a --delete dist/ /var/www/veille/
sudo chown -R ubuntu:ubuntu /var/www/veille

echo "✅ Front déployé sur https://veille.tobenfreeman.dev"
