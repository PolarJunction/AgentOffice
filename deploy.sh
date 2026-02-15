#!/bin/bash

# Deploy script for AgentOffice
# usage: ./deploy.sh

# Ensure we're on the right branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "feature/tileset-rendering" ]; then
  echo "Warning: You are on branch $BRANCH. Deploying feature/tileset-rendering."
fi

echo "🚀 Pushing changes to origin..."
git push origin feature/tileset-rendering

echo "🔄 Connecting to void-node to pull and restart..."
ssh ghost@void-node "cd AgentOffice && git pull origin feature/tileset-rendering && docker compose restart agent-office"

echo "✅ Deployment complete!"
