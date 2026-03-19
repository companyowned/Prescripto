#!/bin/bash

# Prescripto Deployment Script
# This script helps deploy the backend to Vercel and build Android APK

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Prescripto Deployment Script ===${NC}\n"

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}✗ Vercel CLI not found${NC}"
        echo "Install with: npm install -g vercel"
        exit 1
    fi
    
    if ! command -v eas &> /dev/null; then
        echo -e "${YELLOW}⚠ EAS CLI not found - Installing...${NC}"
        npm install -g eas-cli
    fi
    
    echo -e "${GREEN}✓ Prerequisites checked${NC}\n"
}

# Deploy backend to Vercel
deploy_backend() {
    echo -e "${YELLOW}=== Deploying Backend to Vercel ===${NC}\n"
    
    cd backend
    
    echo "Configure your environment variables in Vercel:"
    echo "  - DATABASE_URL"
    echo "  - JWT_SECRET_KEY"
    echo "  - AZURE_VISION_ENDPOINT & KEY"
    echo "  - OPENAI_API_KEY"
    echo "  - Other API keys as needed"
    echo ""
    
    read -p "Ready to deploy? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel --prod
        echo -e "${GREEN}✓ Backend deployed${NC}\n"
        
        read -p "Enter your Vercel project URL (e.g., https://myproject.vercel.app): " VERCEL_URL
        echo "Backend API: ${VERCEL_URL}/api/v1"
    fi
    
    cd ..
}

# Build Android APK
build_android_apk() {
    echo -e "${YELLOW}=== Building Android APK ===${NC}\n"
    
    cd mobile
    
    echo "Method 1: Using EAS (Recommended)"
    echo "  - Faster, cloud-based"
    echo "  - No local Android SDK needed"
    echo ""
    echo "Method 2: Local Build"
    echo "  - Requires Android SDK"
    echo "  - More control over build"
    echo ""
    
    read -p "Choose method (1 or 2): " BUILD_METHOD
    
    if [ "$BUILD_METHOD" = "1" ]; then
        echo -e "\n${YELLOW}Using EAS...${NC}"
        echo "1. Make sure you're logged in to Expo:"
        echo "   eas login"
        echo ""
        
        read -p "Ready to build APK with EAS? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            eas build --platform android --type apk
            echo -e "${GREEN}✓ APK build started${NC}"
            echo "Download your APK from the Expo dashboard"
        fi
    elif [ "$BUILD_METHOD" = "2" ]; then
        echo -e "\n${YELLOW}Local build - checking prerequisites...${NC}"
        
        if [ -z "$ANDROID_HOME" ]; then
            echo -e "${RED}✗ ANDROID_HOME not set${NC}"
            echo "Set it with: export ANDROID_HOME=\$HOME/Library/Android/Sdk"
            exit 1
        fi
        
        echo -e "${GREEN}✓ ANDROID_HOME found${NC}\n"
        echo "Installing dependencies..."
        npm install
        
        read -p "Ready to build APK locally? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            eas build --platform android --local
            echo -e "${GREEN}✓ APK built locally${NC}"
        fi
    else
        echo -e "${RED}Invalid choice${NC}"
        exit 1
    fi
    
    cd ..
}

# Main menu
main_menu() {
    echo -e "${YELLOW}What would you like to do?${NC}\n"
    echo "1. Deploy backend to Vercel"
    echo "2. Build Android APK"
    echo "3. Do both"
    echo "4. Exit"
    echo ""
    
    read -p "Choose option (1-4): " CHOICE
    
    case $CHOICE in
        1)
            check_prerequisites
            deploy_backend
            ;;
        2)
            check_prerequisites
            build_android_apk
            ;;
        3)
            check_prerequisites
            deploy_backend
            build_android_apk
            ;;
        4)
            echo -e "${YELLOW}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            main_menu
            ;;
    esac
}

# Run main menu
main_menu
