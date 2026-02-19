# GPK "Murdjov Pozhar" - Web Platform

> Official web platform for **GPK "Murdjov Pozhar"** (Forest Owners Production Cooperative "Murdjov Fire"), a century-old Bulgarian forestry cooperative based in the village of Slaveyno, Smolyan region.

**Live site:** [murdjovpojar.com](https://murdjovpojar.com/)

---

## About the Organization

GPK "Murdjov Pozhar" was established on **December 20, 1924** and is one of the oldest forestry cooperatives in Bulgaria. Key facts:

- **900+ member-owners** managing cooperative forestry operations
- **26,000+ decares** (6,400+ acres) of managed forest land
- **10,000-15,000 m3** annual timber harvest
- **Up to 10,000 m3** yearly wood processing output
- Dual operations: timber extraction and wood processing/manufacturing
- Located in **village Slaveyno**, Smolyan municipality, Bulgaria

The cooperative serves its members through forest management, timber production, wood processing, and distribution of cooperative documents and news.

### Important Milestones

| Year | Event |
|------|-------|
| 1924 | Founding of the cooperative |
| 1941 | Registration as a production cooperative |
| 1992 | Revival and re-establishment |

---

## What This Platform Does

This web application replaces the cooperative's legacy WordPress site with a modern full-stack platform. It provides:

- **Public website** - Products catalog, photo gallery, news, contact info, and board/control member listings
- **Member portal** - Authenticated access to cooperative documents (minutes, transcripts, accounting docs), member directories, and private news
- **Admin dashboard** - Content management for news, products, gallery, documents, users, and cooperative members
- **Email system** - Account verification, password reset, news notifications with unsubscribe management
- **Document management** - Role-based file uploads/downloads with 7 document categories and per-user access control

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| **Backend** | Python 3.12, FastAPI, Pydantic v2 |
| **Database** | AWS DynamoDB (7 tables) |
| **Storage** | AWS S3 + CloudFront CDN |
| **Auth** | JWT (access + refresh tokens), Argon2 password hashing |
| **Email** | AWS SES |
| **Infrastructure** | AWS CDK (Lambda, API Gateway, S3, CloudFront, Route 53) |
| **CI/CD** | GitHub Actions (PR title validation) |

---

## Project Structure

```
mp_web_site/
├── mp_web_app/
│   ├── frontend/          # React + TypeScript SPA
│   │   ├── components/    # Reusable UI components (shadcn/ui)
│   │   ├── pages/         # Route pages (public, admin, auth)
│   │   ├── hooks/         # Custom React hooks (data fetching)
│   │   ├── context/       # Auth & API client providers
│   │   ├── lib/           # Utilities, config, error handling
│   │   └── src/           # App entry point & routing
│   │
│   └── backend/           # FastAPI Python API
│       ├── auth/          # Authentication (JWT, login, refresh)
│       ├── users/         # User management & roles
│       ├── news/          # News CRUD
│       ├── products/      # Products CRUD
│       ├── gallery/       # Gallery image management (S3)
│       ├── files/         # Document upload/download (S3)
│       ├── members/       # Cooperative member management
│       ├── mail/          # Email operations (SES)
│       ├── database/      # DynamoDB repositories
│       ├── middleware/     # Cache-Control headers
│       └── utils/         # Retry decorator, helpers
│
├── stacks/                # AWS CDK infrastructure stacks
│   ├── backend_stack.py   # Lambda + API Gateway + DynamoDB
│   ├── frontend_stack.py  # S3 + CloudFront for SPA
│   └── uploads_stack.py   # S3 + CloudFront for media
│
├── tests/                 # Test suite
│   └── backend/           # Backend unit & integration tests
│
├── Makefile               # Build orchestration (dev, test, deploy)
├── docker-compose.yaml    # Local DynamoDB
├── app.py                 # CDK app entry point
├── setup.sh               # Automated dev setup
└── pyproject.toml         # UV workspace config
```

---

## Documentation Index

| Document | Description |
|----------|-------------|
| **[Frontend README](mp_web_app/frontend/README.md)** | Deep dive into the React frontend - components, pages, hooks, routing, styling |
| **[Backend README](mp_web_app/backend/README.md)** | Deep dive into the FastAPI backend - API endpoints, models, auth, database |
| **[Infrastructure README](stacks/README.md)** | AWS CDK stacks - Lambda, DynamoDB, S3, CloudFront, Route 53 |
| **[Tests README](tests/README.md)** | Testing strategy, setup, and running tests |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- [pnpm](https://pnpm.io/) 8+ (Node package manager)
- Docker (for local DynamoDB)

### Automated Setup

```bash
./setup.sh
```

This installs `uv` and `pnpm` if missing, then runs `make install-dev`.

### Manual Setup

```bash
# Install all dependencies
make install-dev

# Start local DynamoDB
docker-compose up -d

# Copy and configure environment variables
cp mp_web_app/backend/.env.example mp_web_app/backend/.env
# Edit .env with your AWS credentials and settings
```

### Running Locally

```bash
# Terminal 1 - Backend (http://localhost:8000)
make backend-run

# Terminal 2 - Frontend (http://localhost:3000)
make frontend-dev
```

### Available Make Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start both frontend and backend |
| `make test` | Run all tests |
| `make lint` | Lint both frontend and backend |
| `make format` | Format all code |
| `make check` | Run all checks (lint + format + type-check) |
| `make backend-run` | Start FastAPI dev server |
| `make frontend-dev` | Start Vite dev server |
| `make frontend-build` | Build frontend for production |
| `make cdk-deploy` | Deploy all AWS infrastructure |
| `make deploy-all` | Full production deployment |

---

## User Roles

The platform implements 5 hierarchical user roles:

| Role | Access Level |
|------|-------------|
| **Admin** | Full access - manage all content, users, and settings |
| **Control** | View all documents, members with full details |
| **Board** | View all documents (except accounting), members with full details |
| **Accountant** | Access only accounting documents, can upload accounting files |
| **Regular User** | View public documents, news, member lists (limited details) |

---

## Environment Variables

See [`mp_web_app/backend/.env.example`](mp_web_app/backend/.env.example) for the full list. Key variables:

| Variable | Purpose |
|----------|---------|
| `USERS_TABLE_NAME` | DynamoDB users table |
| `NEWS_TABLE_NAME` | DynamoDB news table |
| `GALLERY_TABLE_NAME` | DynamoDB gallery table |
| `UPLOADS_BUCKET` | S3 bucket for documents |
| `GALLERY_BUCKET` | S3 bucket for gallery images |
| `JWT_SECRET_ARN` | AWS Secrets Manager ARN for JWT signing |
| `FRONTEND_BASE_URL` | Frontend URL for CORS and email links |
| `MAIL_SENDER` | SES verified sender email |

---

## Deployment

The application deploys to AWS using CDK:

- **Frontend:** S3 static hosting + CloudFront CDN at `www.ivan-partsunev.com`
- **Backend:** Lambda function + API Gateway at `api.ivan-partsunev.com`
- **Storage:** S3 buckets with CloudFront CDN for gallery and documents
- **Database:** DynamoDB with auto-scaling write capacity

```bash
# Synthesize CloudFormation templates
make cdk-synth

# Deploy all stacks
make cdk-deploy

# Deploy frontend to S3
make frontend-deploy
```

---

## Code Quality

| Tool | Purpose | Config |
|------|---------|--------|
| **Ruff** | Python linting + formatting | `pyproject.toml` |
| **ESLint** | TypeScript/React linting | `eslint.config.js` |
| **Prettier** | Frontend code formatting | `.prettierrc.json` |
| **GitHub Actions** | PR title validation (conventional commits) | `.github/workflows/` |

Conventional commit types enforced: `feat:`, `fix:`, `chore:`

---

## License

Private project - all rights reserved.
