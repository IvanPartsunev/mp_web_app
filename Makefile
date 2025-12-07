.PHONY: help install install-dev install-prod clean test lint format check
.PHONY: backend-install backend-install-dev backend-test backend-lint backend-format backend-run
.PHONY: frontend-install frontend-install-dev frontend-build frontend-dev frontend-lint frontend-format
.PHONY: cdk-synth cdk-deploy cdk-diff cdk-destroy
.DEFAULT_GOAL := help

# Make 'make --help' work the same as 'make help'
--help: help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)MP Web App - Development Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Installation

install: ## Install all dependencies (workspace + backend + frontend)
	@echo "$(BLUE)Installing all dependencies...$(NC)"
	uv sync --all-groups
	$(MAKE) frontend-install
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

install-dev: ## Install all dependencies including dev tools
	@echo "$(BLUE)Installing all dependencies (with dev)...$(NC)"
	uv sync --all-groups
	$(MAKE) frontend-install-dev
	@echo "$(GREEN)✓ All dependencies (including dev) installed$(NC)"

install-prod: backend-install frontend-install ## Install only production dependencies
	@echo "$(GREEN)✓ Production dependencies installed$(NC)"

clean: ## Clean all build artifacts and dependencies
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf mp_web_app/backend/.venv
	rm -rf mp_web_app/backend/.pytest_cache
	rm -rf mp_web_app/backend/__pycache__
	rm -rf mp_web_app/backend/**/__pycache__
	rm -rf mp_web_app/backend/**/**/__pycache__
	rm -rf mp_web_app/backend/.ruff_cache
	rm -rf mp_web_app/frontend/node_modules
	rm -rf mp_web_app/frontend/dist
	rm -rf mp_web_app/frontend/.vite
	rm -rf cdk.out
	@echo "$(GREEN)✓ Cleaned$(NC)"

##@ Backend (Python)

backend-install: ## Install backend production dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd mp_web_app/backend && uv sync --no-dev

backend-install-dev: ## Install backend dependencies including dev tools
	@echo "$(BLUE)Installing backend dependencies (with dev)...$(NC)"
	cd mp_web_app/backend && uv sync

backend-run: ## Run backend development server
	@echo "$(BLUE)Starting backend server on http://localhost:8000$(NC)"
	cd mp_web_app/backend && uv run uvicorn api:app --reload --port 8000

backend-test: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd mp_web_app/backend && uv run pytest tests/ -v

backend-test-cov: ## Run backend tests with coverage
	@echo "$(BLUE)Running backend tests with coverage...$(NC)"
	cd mp_web_app/backend && uv run pytest tests/ --cov=. --cov-report=html --cov-report=term-missing

backend-lint: ## Lint backend code with ruff
	@echo "$(BLUE)Linting backend code...$(NC)"
	cd mp_web_app/backend && uv run ruff check .

backend-lint-fix: ## Lint and auto-fix backend code
	@echo "$(BLUE)Linting and fixing backend code...$(NC)"
	cd mp_web_app/backend && uv run ruff check --fix .

backend-format: ## Format backend code with ruff
	@echo "$(BLUE)Formatting backend code...$(NC)"
	cd mp_web_app/backend && uv run ruff format .

backend-format-check: ## Check backend code formatting
	@echo "$(BLUE)Checking backend code formatting...$(NC)"
	cd mp_web_app/backend && uv run ruff format --check .

backend-check: backend-lint backend-format-check backend-test ## Run all backend checks (lint, format, test)
	@echo "$(GREEN)✓ All backend checks passed$(NC)"

##@ Frontend (React + Vite)

frontend-install: ## Install frontend production dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd mp_web_app/frontend && pnpm install --prod

frontend-install-dev: ## Install frontend dependencies including dev tools
	@echo "$(BLUE)Installing frontend dependencies (with dev)...$(NC)"
	cd mp_web_app/frontend && pnpm install

frontend-dev: ## Run frontend development server
	@echo "$(BLUE)Starting frontend server on http://localhost:5173$(NC)"
	cd mp_web_app/frontend && pnpm dev

frontend-build: ## Build frontend for production
	@echo "$(BLUE)Building frontend...$(NC)"
	cd mp_web_app/frontend && pnpm build

frontend-preview: ## Preview production build
	@echo "$(BLUE)Previewing production build...$(NC)"
	cd mp_web_app/frontend && pnpm preview

frontend-lint: ## Lint frontend code
	@echo "$(BLUE)Linting frontend code...$(NC)"
	cd mp_web_app/frontend && pnpm lint

frontend-lint-fix: ## Lint and auto-fix frontend code
	@echo "$(BLUE)Linting and fixing frontend code...$(NC)"
	cd mp_web_app/frontend && pnpm lint --fix

frontend-format: ## Format frontend code with prettier
	@echo "$(BLUE)Formatting frontend code...$(NC)"
	cd mp_web_app/frontend && pnpm format

frontend-format-check: ## Check frontend code formatting
	@echo "$(BLUE)Checking frontend code formatting...$(NC)"
	cd mp_web_app/frontend && pnpm format:check

frontend-check: frontend-lint frontend-format-check ## Run all frontend checks
	@echo "$(GREEN)✓ All frontend checks passed$(NC)"

##@ Development

dev: ## Run both backend and frontend in development mode (requires tmux or separate terminals)
	@echo "$(YELLOW)Run these in separate terminals:$(NC)"
	@echo "  Terminal 1: $(GREEN)make backend-run$(NC)"
	@echo "  Terminal 2: $(GREEN)make frontend-dev$(NC)"

test: backend-test ## Run all tests
	@echo "$(GREEN)✓ All tests passed$(NC)"

lint: backend-lint frontend-lint ## Lint all code
	@echo "$(GREEN)✓ All code linted$(NC)"

format: backend-format frontend-format ## Format all code
	@echo "$(GREEN)✓ All code formatted$(NC)"

check: backend-check frontend-check ## Run all checks (lint, format, test)
	@echo "$(GREEN)✓ All checks passed$(NC)"

##@ AWS CDK Deployment

cdk-synth: ## Synthesize CloudFormation template
	@echo "$(BLUE)Synthesizing CDK stack...$(NC)"
	uv run cdk synth

cdk-deploy: ## Deploy CDK stack to AWS
	@echo "$(BLUE)Deploying CDK stack...$(NC)"
	uv run cdk deploy --all

cdk-diff: ## Show differences between local and deployed stack
	@echo "$(BLUE)Showing CDK diff...$(NC)"
	uv run cdk diff

cdk-destroy: ## Destroy CDK stack from AWS
	@echo "$(RED)Destroying CDK stack...$(NC)"
	uv run cdk destroy --all

##@ Frontend Deployment

frontend-deploy: frontend-build ## Build and deploy frontend to S3
	@echo "$(BLUE)Deploying frontend to S3...$(NC)"
	aws s3 sync mp_web_app/frontend/dist/ s3://frontendstack-frontendsitebucket127f9fa2-zjnv4evaddvi/ --delete
	@echo "$(GREEN)✓ Frontend deployed to S3$(NC)"

frontend-deploy-all: frontend-deploy ## Build, deploy to S3
	@echo "$(GREEN)✓ Frontend fully deployed$(NC)"

##@ Utilities

requirements: ## Generate requirements.txt for Lambda deployment
	@echo "$(BLUE)Generating requirements.txt...$(NC)"
	cd mp_web_app/backend && uv pip compile pyproject.toml -o requirements.txt

upgrade-deps: ## Upgrade all dependencies to latest versions
	@echo "$(BLUE)Upgrading backend dependencies...$(NC)"
	cd mp_web_app/backend && uv lock --upgrade
	@echo "$(BLUE)Upgrading frontend dependencies...$(NC)"
	cd mp_web_app/frontend && pnpm update --latest
	@echo "$(GREEN)✓ Dependencies upgraded$(NC)"

deploy-all: requirements cdk-deploy ## Generate requirements and deploy everything
	@echo "$(GREEN)✓ Deployment complete$(NC)"
