#!/bin/bash
# deploy.sh - Tailored for usedocavailable.com
# Usage: ./deploy.sh

# Deploy Config
SSH_USER="hireafri"
SSH_HOST="91.148.168.108" 
SSH_PORT="6543" 
TARGET_DIR="/home/hireafri/usedocavailable.com/"
# Note: Update this if you have a specific SSH key, or comment it out if using default keys/passwords
SSH_KEY="$HOME/.ssh/id_rsa" 

echo "🚀 Starting Deployment to SPanel ($SSH_HOST:$SSH_PORT)..."

# 1. Bundle files locally (Excluding heavy/sensitive folders)
echo "📦 Bundling files..."
tar -czf deploy_bundle.tar.gz \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='.antigravity*' \
    --exclude='public/uploads' \
    --exclude='deploy_bundle.tar.gz' \
    .

# 2. Upload bundle via SCP
echo "📤 Uploading bundle..."
scp -P $SSH_PORT deploy_bundle.tar.gz $SSH_USER@$SSH_HOST:$TARGET_DIR

# 3. Server Side Routine: Extract and Rebuild
echo "⚙️  Extracting and Building on Server..."
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "cd $TARGET_DIR && \
    tar -xzf deploy_bundle.tar.gz && \
    rm deploy_bundle.tar.gz && \
    rm -rf .next && \
    npm install --legacy-peer-deps && \
    npm run build && \
    pkill -f "node server.js" || true && \
    pm2 delete all || true && \
    pm2 start ecosystem.config.js && \
    touch server.js"

# 4. Cleanup local bundle
rm deploy_bundle.tar.gz

echo "🎉 Deployment Complete! App and Monitor have been restarted."
