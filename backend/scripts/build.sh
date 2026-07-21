#!/bin/bash

echo "📦 Building frontend..."
cd ../frontend
npm install
npm run build

echo "📁 Copying build to backend..."
mkdir -p ../backend/frontend
cp -r build/* ../backend/frontend/

echo "✅ Frontend built and copied successfully!"
