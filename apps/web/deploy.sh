#!/bin/bash
# Deploy Next.js web viewer to Vercel

set -e

echo "🚀 Deploying Relationship Referee Web Viewer to Vercel..."
echo ""

# Ensure we're in the web directory
cd "$(dirname "$0")"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "Creating .env.production..."
    echo "NEXT_PUBLIC_API_URL=https://relationship-ref-production.up.railway.app" > .env.production
fi

echo "📦 Running build to verify..."
npm run build

echo ""
echo "✅ Build successful!"
echo ""
echo "🌐 Now deploying to Vercel..."
echo ""
echo "Follow the prompts:"
echo "  1. Link to existing project? → No (first time) or Yes (subsequent)"
echo "  2. Project name? → relationship-referee-web (or your choice)"
echo "  3. Directory? → ./"
echo "  4. Modify settings? → No"
echo ""

# Deploy to Vercel
npx vercel --prod

echo ""
echo "✨ Deployment complete!"
echo ""
echo "🔗 Your web viewer is now live!"
echo "   Test with: https://YOUR_VERCEL_URL/share/report/TOKEN"
echo ""
