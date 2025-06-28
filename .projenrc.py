from projen.javascript import NodeProject, NodePackageManager
from projen.python import PythonProject

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

backend = PythonProject(
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

frontend = NodeProject(
  parent=project,
  outdir="mp_web_app/frontend",
  name="frontend",
  default_release_branch="main",
  package_manager=NodePackageManager.NPM,

  deps=[
    "react@^18.2.0",
    "react-dom@^18.2.0",
    "react-router-dom@^6.8.0",
    "axios@^1.3.0",
  ],

  dev_deps=[
    "@types/react@^18.0.27",
    "@types/react-dom@^18.0.10",
    "@vitejs/plugin-react@^4.0.0",
    "vite@^4.1.0",
    "typescript@^4.9.0",  # Use TypeScript 4.x to avoid conflicts
    "@typescript-eslint/eslint-plugin@^5.54.0",
    "@typescript-eslint/parser@^5.54.0",
    "eslint@^8.35.0",
    "eslint-plugin-react-hooks@^4.6.0",
    "eslint-plugin-react-refresh@^0.3.4",
  ],
)

# Add necessary config files to frontend
frontend.add_git_ignore("dist")
frontend.add_git_ignore("node_modules")
frontend.add_git_ignore(".env.local")
frontend.add_git_ignore(".env.development.local")
frontend.add_git_ignore(".env.test.local")
frontend.add_git_ignore(".env.production.local")

backend.add_git_ignore("poetry.lock")

project.add_git_ignore(".qodo/")
project.add_git_ignore(".env/")
project.add_git_ignore(".idea/")
project.add_git_ignore("dynamodb_data/")

frontend.add_scripts({"dev": "vite"})
frontend.add_scripts({"build": "vite build"})
frontend.add_scripts({"preview": "vite preview"})
frontend.add_scripts({"lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"})

# Override any default scripts that might include react-scripts
frontend.add_scripts({"start": "vite"})

# Remove the TypeScript check from build for now
frontend.remove_script("compile")

# frontend.tsconfig.file.add_override("compilerOptions.baseUrl", ".")
# frontend.tsconfig.file.add_override("compilerOptions.paths", {
#   "@/*": ["./*"]
# })

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
                 exec="cd mp_web_app/frontend && npm run dev")

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
