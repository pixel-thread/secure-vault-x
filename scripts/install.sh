#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Starting clean installation...${NC}\n"

# Step 1: Remove all node_modules
echo -e "${YELLOW}1. Removing node_modules...${NC}"
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -rf **/.turbo/**
echo -e "${GREEN}✓ Removed all node_modules${NC}\n"

# Step 2: Remove build artifacts
echo -e "${YELLOW}2. Removing build artifacts...${NC}"
rm -rf apps/web/.next
rm -rf packages/*/dist
echo -e "${GREEN}✓ Removed build artifacts${NC}\n"

# Step 3: Remove generated Prisma files
echo -e "${YELLOW}3. Removing generated Prisma files...${NC}"
rm -rf packages/prisma/dist
rm -rf packages/prisma/src/generated
echo -e "${GREEN}✓ Removed Prisma generated files${NC}\n"

# Step 4: Remove lock files
echo -e "${YELLOW}4. Removing lock files...${NC}"
rm -rf pnpm-lock.yaml
rm -rf package-lock.json
rm -rf yarn.lock
echo -e "${GREEN}✓ Removed lock files${NC}\n"

# Step 5: Install dependencies
echo -e "${YELLOW}5. Installing dependencies...${NC}"
pnpm install
pnpm turbo run build
pnpm run generate
echo -e "${GREEN}✓ Installed dependencies${NC}\n"

# Step 6: Generate Prisma client
echo -e "${YELLOW}6. Generating Prisma client...${NC}"
pnpm turbo run db:generate
echo -e "${GREEN}✓ Generated Prisma client${NC}\n"

echo -e "${GREEN}✅ Clean installation complete!${NC}"
