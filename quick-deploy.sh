#!/bin/bash

# Quick Start: Deploy Prescripto Backend & APK
# This is a simplified version of the full deployment script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Prescripto Deployment Quick Start    ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}\n"

# Step 1: Install CLI tools
echo -e "${YELLOW}Step 1: Installing CLI tools...${NC}\n"

if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

echo -e "${GREEN}✓ CLI tools ready\n${NC}"

# Step 2: Backend deployment
echo -e "${YELLOW}Step 2: Backend Deployment${NC}"
echo -e "${YELLOW}────────────────────────${NC}\n"

echo "Before deploying, you'll need:"
echo "  1. Database URL (PostgreSQL)"
echo "  2. JWT Secret Key"
echo "  3. API Keys (Azure Vision, OpenAI, etc.)"
echo ""

read -p "Deploy backend to Vercel now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    vercel --prod
    
    # Get the deployment URL
    echo ""
    read -p "Enter your Vercel project URL (e.g., https://myproject.vercel.app): " VERCEL_URL
    
    echo -e "\n${GREEN}✓ Backend deployed at: ${VERCEL_URL}/api/v1${NC}\n"
    
    # Save for mobile app
    BACKEND_URL="${VERCEL_URL}/api/v1"
    
    cd ..
else
    echo -e "${YELLOW}Skipping backend deployment\n${NC}"
fi

# Step 3: Mobile app configuration
echo -e "${YELLOW}Step 3: Mobile App Configuration${NC}"
echo -e "${YELLOW}────────────────────────────────${NC}\n"

if [ ! -z "$BACKEND_URL" ]; then
    echo "Updating mobile app .env.production with backend URL..."
    echo "EXPO_PUBLIC_API_URL=${BACKEND_URL}" > mobile/.env.production
    echo -e "${GREEN}✓ Updated${NC}\n"
fi

# Step 4: Build Android APK
echo -e "${YELLOW}Step 4: Build Android APK${NC}"
echo -e "${YELLOW}───────────────────────${NC}\n"

echo "Two options:"
echo "  1. Cloud build (EAS) - Recommended, no local setup needed"
echo "  2. Local build - Requires Android SDK"
echo ""

read -p "Build method (1 or 2): " BUILD_METHOD

if [ "$BUILD_METHOD" = "1" ]; then
    echo ""
    echo "Make sure you're logged into Expo:"
    echo "  eas login"
    echo ""
    
    read -p "Ready to build APK? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd mobile
        echo -e "\n${YELLOW}Building APK... This may take 5-15 minutes${NC}\n"
        eas build --platform android --type apk
        
        echo -e "\n${GREEN}✓ APK build started!${NC}"
        echo "Download from: https://expo.dev/builds"
        
        cd ..
    fi
elif [ "$BUILD_METHOD" = "2" ]; then
    echo -e "\n${YELLOW}Local build mode${NC}\n"
    
    if [ -z "$ANDROID_HOME" ]; then
        echo -e "${RED}✗ ANDROID_HOME not set${NC}"
        echo "Set it with:"
        echo "  export ANDROID_HOME=\$HOME/Library/Android/Sdk"
        exit 1
    fi
    
    cd mobile
    npm install
    eas build --platform android --local
    
    echo -e "\n${GREEN}✓ APK built locally${NC}"
    echo "Find it in: android/app/build/outputs/apk/"
    
    cd ..
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

# Summary
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Steps Completed!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"

echo "Next steps:"
echo "  1. Test backend API: curl ${VERCEL_URL:-'https://your-vercel-url'}/health"
echo "  2. Download APK from Expo dashboard"
echo "  3. Install on Android device: adb install prescripto.apk"
echo "  4. Test the app!"
echo ""
echo "Documentation:"
echo "  - Backend: See DEPLOYMENT_GUIDE.md"
echo "  - Android: See ANDROID_BUILD_GUIDE.md"
echo ""
