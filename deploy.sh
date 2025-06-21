#!/bin/bash

echo "🚀 AI Article Generator Deployment Script"
echo "========================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized"
    echo "Please run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found"
    echo "Please install Heroku CLI first: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Get app name from user
read -p "Enter your Heroku app name: " APP_NAME

# Create Heroku app
echo "📦 Creating Heroku app..."
heroku create $APP_NAME

# Set environment variables
echo "🔧 Setting environment variables..."
read -p "Enter your OpenAI API key: " OPENAI_KEY
read -p "Enter your MongoDB Atlas connection string: " MONGODB_URI
read -p "Enter your JWT secret: " JWT_SECRET

heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=$OPENAI_KEY
heroku config:set MONGODB_URI=$MONGODB_URI
heroku config:set JWT_SECRET=$JWT_SECRET

# Optional API keys
read -p "Enter your News API key (optional, press Enter to skip): " NEWS_KEY
if [ ! -z "$NEWS_KEY" ]; then
    heroku config:set NEWS_API_KEY=$NEWS_KEY
fi

read -p "Enter your Unsplash API key (optional, press Enter to skip): " UNSPLASH_KEY
if [ ! -z "$UNSPLASH_KEY" ]; then
    heroku config:set UNSPLASH_ACCESS_KEY=$UNSPLASH_KEY
fi

read -p "Enter your Pexels API key (optional, press Enter to skip): " PEXELS_KEY
if [ ! -z "$PEXELS_KEY" ]; then
    heroku config:set PEXELS_API_KEY=$PEXELS_KEY
fi

# Deploy
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to production"
git push heroku main

# Open the app
echo "🌐 Opening your app..."
heroku open

echo "✅ Deployment completed!"
echo "Your app is live at: https://$APP_NAME.herokuapp.com"
echo ""
echo "📋 Next steps:"
echo "1. Test all features"
echo "2. Set up custom domain (optional)"
echo "3. Monitor your app logs: heroku logs --tail" 