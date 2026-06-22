#!/bin/bash
# Vercel Environment Variables Setup Script
# Run this after Vercel login is restored
# Usage: bash scripts/setup-vercel-env.sh

set -e

PROJECT_NAME="eu-ai-act-v2"

echo "=========================================="
echo "Vercel Environment Variables Setup"
echo "Project: $PROJECT_NAME"
echo "=========================================="
echo ""

# Check if logged in to Vercel
if ! vercel whoami >/dev/null 2>&1; then
  echo "Error: Not logged in to Vercel."
  echo "Please run: vercel login"
  exit 1
fi

echo "Step 1: Removing deprecated PAYMENT_GATEWAY env var..."
vercel env rm PAYMENT_GATEWAY production --yes 2>/dev/null || true
vercel env rm PAYMENT_GATEWAY preview --yes 2>/dev/null || true
vercel env rm PAYMENT_GATEWAY development --yes 2>/dev/null || true
echo "Done."
echo ""

echo "Step 2: Adding ADMIN_EMAILS..."
read -p "Enter your admin email address: " ADMIN_EMAIL
vercel env add ADMIN_EMAILS production "$ADMIN_EMAIL"
vercel env add ADMIN_EMAILS preview "$ADMIN_EMAIL"
vercel env add ADMIN_EMAILS development "$ADMIN_EMAIL"
echo "Done."
echo ""

echo "Step 3: Adding Paddle environment variables..."
read -p "Enter Paddle API Key: " PADDLE_API_KEY
vercel env add PADDLE_API_KEY production "$PADDLE_API_KEY"
vercel env add PADDLE_API_KEY preview "$PADDLE_API_KEY"

echo ""
read -p "Enter Paddle Webhook Secret: " PADDLE_WEBHOOK_SECRET
vercel env add PADDLE_WEBHOOK_SECRET production "$PADDLE_WEBHOOK_SECRET"
vercel env add PADDLE_WEBHOOK_SECRET preview "$PADDLE_WEBHOOK_SECRET"

echo ""
read -p "Enter Paddle Starter Price ID: " PADDLE_STARTER
vercel env add PADDLE_STARTER_PRICE_ID production "$PADDLE_STARTER"
vercel env add PADDLE_STARTER_PRICE_ID preview "$PADDLE_STARTER"

echo ""
read -p "Enter Paddle Professional Price ID: " PADDLE_PRO
vercel env add PADDLE_PROFESSIONAL_PRICE_ID production "$PADDLE_PRO"
vercel env add PADDLE_PROFESSIONAL_PRICE_ID preview "$PADDLE_PRO"

echo ""
read -p "Enter Paddle Business Price ID: " PADDLE_BUS
vercel env add PADDLE_BUSINESS_PRICE_ID production "$PADDLE_BUS"
vercel env add PADDLE_BUSINESS_PRICE_ID preview "$PADDLE_BUS"

echo ""
read -p "Enter Paddle Enterprise Price ID: " PADDLE_ENT
vercel env add PADDLE_ENTERPRISE_PRICE_ID production "$PADDLE_ENT"
vercel env add PADDLE_ENTERPRISE_PRICE_ID preview "$PADDLE_ENT"

echo ""
echo "=========================================="
echo "All environment variables configured!"
echo "Next steps:"
echo "1. Redeploy: vercel --prod"
echo "2. Run DB migration: npx prisma migrate deploy"
echo "=========================================="
