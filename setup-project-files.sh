#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║  ${GREEN}TuneFlow Project Files Setup${BLUE}                           ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  No .env file found. Creating one...${NC}"
  touch .env
  echo "# Supabase configuration" >> .env
  echo "NEXT_PUBLIC_SUPABASE_URL=" >> .env
  echo "SUPABASE_SERVICE_ROLE_KEY=" >> .env
  echo -e "${GREEN}✅ Created .env file${NC}"
fi

# Prompt for Supabase URL and key if not set
echo -e "${BLUE}📋 Supabase Configuration${NC}"
echo -e "${YELLOW}Please provide your Supabase credentials:${NC}"

# Read current values from .env file
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env | cut -d '=' -f2)
SUPABASE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d '=' -f2)

# Prompt for Supabase URL if not set
if [ -z "$SUPABASE_URL" ]; then
  echo -n "Enter your Supabase URL: "
  read SUPABASE_URL
  sed -i '' "s/NEXT_PUBLIC_SUPABASE_URL=/NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL/" .env
else
  echo -e "Supabase URL: ${GREEN}[Already configured]${NC}"
fi

# Prompt for Supabase service role key if not set
if [ -z "$SUPABASE_KEY" ]; then
  echo -n "Enter your Supabase service role key: "
  read SUPABASE_KEY
  sed -i '' "s/SUPABASE_SERVICE_ROLE_KEY=/SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY/" .env
else
  echo -e "Supabase service role key: ${GREEN}[Already configured]${NC}"
fi

echo
echo -e "${BLUE}🚀 Running setup script...${NC}"
echo

# Export environment variables
export NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY

# Run the setup script
node --experimental-modules src/lib/setup/setup-project-files.js

# Check if the script execution was successful
if [ $? -eq 0 ]; then
  echo
  echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                                        ║${NC}"
  echo -e "${GREEN}║  ✅ Setup completed successfully!                       ║${NC}"
  echo -e "${GREEN}║                                                        ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
  echo
  echo -e "${BLUE}🎉 You can now add files to your projects on the user page.${NC}"
  echo
  echo -e "${YELLOW}Don't forget to:${NC}"
  echo -e "1. Restart your application to apply the changes"
  echo -e "2. Test the file upload functionality on a project card"
  echo
else
  echo
  echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                                                        ║${NC}"
  echo -e "${RED}║  ❌ Setup encountered some issues                       ║${NC}"
  echo -e "${RED}║                                                        ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
  echo
  echo -e "${YELLOW}Please check the error messages above and:${NC}"
  echo -e "1. Verify your Supabase credentials"
  echo -e "2. Make sure you have the necessary permissions"
  echo -e "3. Consider running the SQL migration manually in the Supabase dashboard"
  echo
fi
