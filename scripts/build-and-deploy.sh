#!/bin/bash

# ============================================
# Build & Deploy Client Script
# ============================================
# Compila e ofusca o código JavaScript do cliente
# e reinicia o servidor de assets para aplicar
# ============================================

echo "🔨 Building and obfuscating client..."
docker exec t-engine-game npm run build:client

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "🔄 Restarting asset server..."
    docker restart t-engine-assets
    echo ""
    echo "🚀 Deploy complete! Client updated with obfuscated code."
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
