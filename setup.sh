#!/bin/bash
set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}MP Web App - Setup Script${NC}"
echo ""

# Check if uv is installed
if ! command -v uv &> /dev/null; then
  echo -e "${YELLOW}uv not found. Installing...${NC}"
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.cargo/bin:$PATH"
  echo -e "${GREEN}✓ uv installed${NC}"
else
  echo -e "${GREEN}✓ uv already installed${NC}"
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}pnpm not found. Installing...${NC}"
  npm install -g pnpm
  echo -e "${GREEN}✓ pnpm installed${NC}"
else
  echo -e "${GREEN}✓ pnpm already installed${NC}"
fi

echo ""
echo -e "${BLUE}Cleaning old dependencies...${NC}"
rm -rf .venv mp_web_app/backend/.venv
rm -rf mp_web_app/frontend/node_modules
rm -rf .projen mp_web_app/backend/.projen mp_web_app/frontend/.projen
echo -e "${GREEN}✓ Cleaned${NC}"

echo ""
echo -e "${BLUE}Installing dependencies...${NC}"
make install-dev

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Run ${GREEN}make backend-run${NC} in one terminal"
echo -e "  2. Run ${GREEN}make frontend-dev${NC} in another terminal"
echo -e "  3. Run ${GREEN}make help${NC} to see all available commands"
echo ""
