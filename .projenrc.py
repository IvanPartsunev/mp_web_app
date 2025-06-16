from projen import javascript
from projen.javascript import NodeProject, NodePackageManager
from projen.python import PythonProject
from projen.web import ReactTypeScriptProject

python_version = "3.12.8"

project = PythonProject(
  description="MP Web Site with CDK infrastructure and FastAPI backend",
  author_email="ivan.parcunev@gmail.com",
  author_name="Ivan Partsunev",
  module_name="mp_web_app",
  name="mp-web-app",
  version="0.1.0",
  poetry=True,
  poetry_options={"package_mode": False},

  # Main project dependencies (CDK infrastructure)
  deps=[
    f"python@{python_version}",
    "aws-cdk-lib@2.38.0",
    "constructs@10.0.0",
    "boto3@1.35.88",
  ],

  # Development dependencies
  dev_deps=[
    "pytest",
    "pytest-cov",
  ],

  # Configure pytest
  pytest=True,  # Enable pytest for testing
)

PythonProject(
  parent=project,
  outdir="mp_web_app/backend",
  module_name="backend",
  name="backend",
  version="0.1.0",
  poetry=True,
  author_email="ivan.parcunev@gmail.com",
  author_name="Ivan Partsunev",
  deps=[
    f"python@{python_version}",
    "fastapi@0.115.12",
    "pydantic@2.10.3",
    "pydantic@{version = '2.11.3', extras = ['email']}",
    "uvicorn@0.34.2",
    "mangum@0.19.0",
    "python-jose@^3.4.0",
    "argon2-cffi@^23.1.0",
    "pydantic-settings@2.9.1",
    "python-multipart@^0.0.20",
  ],
)

frontend = ReactTypeScriptProject(
    parent=project,
    outdir="mp_web_app/frontend",
    name="frontend",
    default_release_branch="main",
    package_manager=javascript.NodePackageManager.PNPM,
    deps=["axios"],
    dev_deps=["@types/react"],  # dev deps
    eslint=True,
    jest=True,
)

# Add .gitignore entries for API-specific files
project.add_git_ignore("mp_web_app/backend/poetry.lock")
project.add_git_ignore(".qodo/")
project.add_git_ignore(".env/")
project.add_git_ignore(".idea/")
project.add_git_ignore("dynamodb_data/")

# Task: Initialize the API component with Poetry
# This creates a separate Poetry environment for the API
project.add_task("api:init",
                 exec=f"cd mp_web_app/backend/backend && poetry init -n --name mp-api --python '{python_version}'")

# Task: Install API dependencies
# This installs all dependencies for the API component
project.add_task("api:install",
                 exec="cd mp_web_app/backend/backend && poetry install --no-root")

# Task: Run the API locally
# This starts the FastAPI server on port 8001 with auto-reload
project.add_task("api:run",
                 exec="cd mp_web_app/backend && poetry run uvicorn api:app --reload --port 8001")

# Task: Generate requirements.txt for Lambda deployment
# This exports Poetry dependencies to a requirements.txt file for AWS Lambda
project.add_task("api:requirements",
                 exec="cd mp_web_app/backend/backend && poetry export -f requirements.txt --output requirements.txt --without-hashes")

# Task: Start React app
# This starts the React app
project.add_task("frontend:start",
                 exec="cd mp_web_app/frontend && pnpm start")

# CDK-specific tasks
# Task: Synthesize CloudFormation template
project.add_task("cdk:synth",
                 exec="poetry run cdk synth")

# Task: Deploy the CDK stack to AWS
project.add_task("cdk:deploy",
                 exec="poetry run cdk deploy")

# Task: Show differences between local CDK stack and deployed stack
project.add_task("cdk:diff",
                 exec="poetry run cdk diff")

# Combined tasks for convenience
# Task: Install all dependencies (both main project and API)
project.add_task("install:all",
                 exec="poetry install && npx projen api:install")

# Task: Deploy everything (generate requirements.txt and deploy CDK stack)
project.add_task("deploy:all",
                 exec="npx projen api:requirements && npx projen cdk:deploy")

project.synth()
