#!/bin/bash

# Prescripto Deployment Environment Setup
# This script helps generate and validate environment variables

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Prescripto Environment Setup Helper                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Generate JWT Secret
generate_jwt_secret() {
    echo -e "${YELLOW}Generating JWT Secret Key...${NC}"
    openssl rand -base64 32
}

# Function to check if variable is set
check_env_var() {
    local var_name=$1
    local prompt=$2
    
    read -p "${prompt}: " user_input
    
    if [ -z "$user_input" ]; then
        echo -e "${RED}✗ Empty input${NC}"
        return 1
    fi
    
    echo "$user_input"
}

# Create environment config
echo -e "${YELLOW}Step 1: Database Configuration${NC}\n"

echo "What database provider are you using?"
echo "1. Neon (recommended, serverless PostgreSQL)"
echo "2. AWS RDS"
echo "3. Vercel Postgres"
echo "4. Other PostgreSQL provider"
echo ""

read -p "Choose (1-4): " DB_CHOICE

case $DB_CHOICE in
    1)
        echo -e "\n${BLUE}Neon Setup:${NC}"
        echo "1. Go to https://console.neon.tech"
        echo "2. Create new project or select existing"
        echo "3. Click 'Connection' and copy the connection string"
        echo "4. Add '?ssl=require' if not present"
        echo ""
        DB_URL=$(check_env_var "DATABASE_URL" "Paste your Neon connection string")
        ;;
    2)
        echo -e "\n${BLUE}AWS RDS Setup:${NC}"
        echo "Format: postgresql+asyncpg://user:password@host:5432/database"
        echo ""
        DB_URL=$(check_env_var "DATABASE_URL" "Enter your RDS connection string")
        ;;
    3)
        echo -e "\n${BLUE}Vercel Postgres Setup:${NC}"
        echo "Use 'vercel postgres create' in your project"
        echo ""
        DB_URL=$(check_env_var "DATABASE_URL" "Paste your Vercel Postgres connection string")
        ;;
    *)
        echo ""
        DB_URL=$(check_env_var "DATABASE_URL" "Enter your PostgreSQL connection string")
        ;;
esac

echo -e "\n${YELLOW}Step 2: Security Configuration${NC}\n"

# JWT Secret
echo "Generating secure JWT secret key..."
JWT_SECRET=$(generate_jwt_secret)
echo -e "${GREEN}✓ Generated${NC}\n"

echo -e "${BLUE}JWT_SECRET_KEY:${NC}"
echo "$JWT_SECRET"
echo ""

# Other settings
echo -e "${YELLOW}Step 3: Azure Vision (OCR) Configuration${NC}\n"

echo "Azure Vision is used for prescription document OCR (text extraction)"
echo ""

read -p "Do you have Azure Vision credentials? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    AZURE_ENDPOINT=$(check_env_var "AZURE_VISION_ENDPOINT" "Enter Azure endpoint (e.g., https://region.api.cognitive.microsoft.com/)")
    AZURE_KEY=$(check_env_var "AZURE_VISION_KEY" "Enter Azure API key")
else
    echo -e "${YELLOW}To get Azure Vision credentials:${NC}"
    echo "1. Go to https://portal.azure.com"
    echo "2. Create 'Computer Vision' resource"
    echo "3. Copy endpoint and key from resource"
    echo ""
    AZURE_ENDPOINT=""
    AZURE_KEY=""
fi

echo ""
echo -e "${YELLOW}Step 4: OpenAI Configuration${NC}\n"

echo "OpenAI is used for prescription analysis and insights"
echo ""

read -p "Do you have OpenAI API key? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    OPENAI_KEY=$(check_env_var "OPENAI_API_KEY" "Enter your OpenAI API key (starts with sk-)")
else
    echo -e "${YELLOW}To get OpenAI credentials:${NC}"
    echo "1. Go to https://platform.openai.com"
    echo "2. Create API key in account settings"
    echo ""
    OPENAI_KEY=""
fi

echo ""
echo -e "${YELLOW}Step 5: Storage Configuration${NC}\n"

echo "How do you want to store uploaded files?"
echo "1. Local filesystem (good for development)"
echo "2. AWS S3 (recommended for production)"
echo ""

read -p "Choose (1-2): " STORAGE_CHOICE

if [ "$STORAGE_CHOICE" = "2" ]; then
    S3_BUCKET=$(check_env_var "S3_BUCKET_NAME" "Enter S3 bucket name")
    S3_ENDPOINT=$(check_env_var "S3_ENDPOINT_URL" "Enter S3 endpoint (optional, press Enter to skip)")
    AWS_ACCESS=$(check_env_var "AWS_ACCESS_KEY_ID" "Enter AWS access key")
    AWS_SECRET=$(check_env_var "AWS_SECRET_ACCESS_KEY" "Enter AWS secret key")
    STORAGE_BACKEND="s3"
else
    S3_BUCKET=""
    S3_ENDPOINT=""
    AWS_ACCESS=""
    AWS_SECRET=""
    STORAGE_BACKEND="local"
fi

echo ""
echo -e "${YELLOW}Step 6: n8n Workflow Configuration${NC}\n"

echo "n8n is used for automated prescription processing workflows"
echo ""

read -p "Do you have n8n configured? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    N8N_WEBHOOK=$(check_env_var "N8N_WEBHOOK_URL" "Enter n8n webhook URL")
    N8N_KEY=$(check_env_var "N8N_AUTH_KEY" "Enter n8n auth key")
else
    N8N_WEBHOOK=""
    N8N_KEY=""
fi

# Summary
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Generated Environment Variables${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}\n"

cat > /tmp/prescripto-env.txt << EOF
# Prescripto Environment Variables
# Generated on $(date)

# Application
APP_NAME=Prescripto
APP_VERSION=1.0.0
DEBUG=false

# Database
DATABASE_URL=$DB_URL

# JWT
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Storage
STORAGE_BACKEND=$STORAGE_BACKEND
UPLOAD_DIR=uploads
S3_BUCKET_NAME=$S3_BUCKET
S3_ENDPOINT_URL=$S3_ENDPOINT
AWS_ACCESS_KEY_ID=$AWS_ACCESS
AWS_SECRET_ACCESS_KEY=$AWS_SECRET

# Azure Vision (OCR)
AZURE_VISION_ENDPOINT=$AZURE_ENDPOINT
AZURE_VISION_KEY=$AZURE_KEY

# OpenAI
OPENAI_API_KEY=$OPENAI_KEY

# n8n Workflow
N8N_WEBHOOK_URL=$N8N_WEBHOOK
N8N_AUTH_KEY=$N8N_KEY

# Celery/Redis (Optional)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
EOF

echo "Environment variables saved to: /tmp/prescripto-env.txt"
echo ""

echo -e "${YELLOW}How to use these variables:${NC}\n"

echo "1. ${BLUE}For Local Development:${NC}"
echo "   Copy to backend/.env file:"
echo "   ${YELLOW}cat /tmp/prescripto-env.txt > backend/.env${NC}"
echo ""

echo "2. ${BLUE}For Vercel Deployment:${NC}"
echo "   Add each variable to Vercel project:"
echo "   ${YELLOW}vercel env add VARIABLE_NAME < value${NC}"
echo ""
echo "   Or in Vercel dashboard:"
echo "   Settings → Environment Variables → Add each variable"
echo ""

echo "3. ${BLUE}View all variables:${NC}"
echo "   ${YELLOW}cat /tmp/prescripto-env.txt${NC}"
echo ""

# Display the variables
echo -e "${BLUE}Preview:${NC}\n"
cat /tmp/prescripto-env.txt

echo ""
echo -e "${YELLOW}⚠️  Security Notes:${NC}"
echo "  • Keep JWT_SECRET_KEY secure - never commit to git"
echo "  • Rotate API keys periodically"
echo "  • Use environment variables, never hardcode secrets"
echo "  • Enable database SSL connections in production"
echo ""

echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Create backend/.env with the generated variables"
echo "2. Test locally: uvicorn app.main:app --reload"
echo "3. Deploy to Vercel with: vercel --prod"
echo ""
