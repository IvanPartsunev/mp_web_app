# Infrastructure - AWS CDK Stacks

The infrastructure is defined as code using **AWS CDK** (Cloud Development Kit) in Python. It provisions all AWS resources needed to run the platform.

---

## Architecture Overview

```
                                    +---------------------+
                                    |    Route 53 DNS      |
                                    |  ivan-partsunev.com  |
                                    +------+------+--------+
                                           |      |
                              +------------+      +------------+
                              v                                v
                   +---------------------+          +---------------------+
                   |  CloudFront (www.)   |          |  API Gateway (api.) |
                   |   Frontend SPA       |          |   REST API          |
                   +----------+----------+          +----------+----------+
                              |                                |
                              v                                v
                   +---------------------+          +---------------------+
                   |   S3 Bucket          |          |   Lambda Function   |
                   |   (Static Files)     |          |   (FastAPI/Mangum)  |
                   +---------------------+          +----------+----------+
                                                               |
                              +--------------+-----------------+---------------+
                              v              v                 v               v
                   +--------------+  +--------------+  +--------------+  +--------------+
                   |  DynamoDB    |  |  S3 Uploads   |  |  SES Email   |  |  Secrets Mgr |
                   |  (7 tables)  |  |  + CloudFront |  |              |  |  (JWT secret)|
                   +--------------+  +--------------+  +--------------+  +--------------+
```

---

## Stacks

### 1. FrontendStack (`frontend_stack.py`)

Hosts the React SPA as a static website.

| Resource | Type | Details |
|----------|------|---------|
| S3 Bucket | Storage | Private, block all public access, auto-delete on destroy |
| CloudFront Distribution | CDN | HTTPS redirect, OAI for S3 access, 404 -> `/index.html` |
| Route 53 A Record | DNS | `www.ivan-partsunev.com` -> CloudFront |

- Default root object: `index.html`
- Error handling: 404 returns `/index.html` with 200 (SPA client-side routing)
- SSL: ACM certificate (us-east-1)

---

### 2. UploadsStack (`uploads_stack.py`)

Manages file storage for gallery images and documents.

| Resource | Type | Details |
|----------|------|---------|
| S3 Bucket | Storage | Private, block public access, RETAIN removal policy |
| CloudFront Distribution | CDN | Caching optimized, compression enabled, Price Class 100 |

- Removal policy: RETAIN (preserves data even on stack deletion)
- Price class: US/Canada/Europe only

---

### 3. BackendStack (`backend_stack.py`)

The main stack provisioning the API, database, and compute.

| Resource | Type | Details |
|----------|------|---------|
| Secrets Manager Secret | Security | 64-char random JWT secret |
| DynamoDB Tables (7) | Database | Auto-scaling write capacity |
| Lambda Function | Compute | Python 3.12, 1024 MB, 30s timeout |
| API Gateway (REST) | API | Proxy integration, custom domain |
| Route 53 A Record | DNS | `api.ivan-partsunev.com` -> API Gateway |

#### DynamoDB Tables

| Table | Partition Key | GSI | TTL |
|-------|--------------|-----|-----|
| `users_table` | `id` (S) | `email_index` | - |
| `members_table` | `member_code` (S) | - | - |
| `refresh_table` | `id` (S) | - | `expires_at` |
| `uploads_table` | `id` (S) | `file_type_created_at_index` | - |
| `news_table` | `id` (S) | `news_created_at_index` | - |
| `gallery_table` | `id` (S) | `gallery_created_at_index` | - |
| `products_table` | `id` (S) | - | - |

#### Lambda IAM Permissions

| Service | Actions |
|---------|---------|
| DynamoDB | Read/Write on all 7 tables + GSIs |
| S3 | PutObject, GetObject, DeleteObject, ListBucket |
| SES | SendEmail, SendRawEmail |
| Secrets Manager | GetSecretValue (JWT secret) |
| CloudFront | CreateInvalidation (conditional) |

---

## Domain Configuration

| Component | Domain |
|-----------|--------|
| Frontend | `www.ivan-partsunev.com` |
| API | `api.ivan-partsunev.com` |
| DNS Zone | `ivan-partsunev.com` (Route 53) |
| SSL | ACM Certificate (us-east-1) |

---

## Deployment

```bash
make cdk-synth       # Synthesize CloudFormation templates
make cdk-diff        # Preview changes
make cdk-deploy      # Deploy all stacks
make frontend-deploy # Build + sync frontend to S3
make deploy-all      # Full deployment (requirements + CDK)
make cdk-destroy     # Tear down (caution!)
```

### Deployment Order

1. `DomainLookupStack` - DNS and certificate lookup
2. `UploadsStack` - S3 + CloudFront (needed by BackendStack)
3. `FrontendStack` - S3 + CloudFront for SPA
4. `BackendStack` - Lambda + API Gateway + DynamoDB (depends on UploadsStack)
