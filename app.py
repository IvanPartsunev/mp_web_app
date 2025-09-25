from aws_cdk import App, Environment
from aws_cdk import aws_route53 as route53
from aws_cdk import aws_certificatemanager as acm

from stacks.frontend_stack import FrontendStack
from stacks.uploads_stack import UploadsStack
from stacks.backend_stack import BackendStack

# --- Configuration ---
# IMPORTANT: Replace these placeholder values with your actual domain details.

# 1. Your custom domain name.
DOMAIN_NAME = "ivan-partsunev.com"

# 2. Subdomains for your frontend and backend.
FRONTEND_SUBDOMAIN = "www"
API_SUBDOMAIN = "api"

# 3. The Hosted Zone ID for your domain from AWS Route 53.
HOSTED_ZONE_ID = "Z04684445P1BPRRLOCFS"

# 4. The ARN of your ACM Certificate.
# IMPORTANT: This certificate must be in the us-east-1 region for CloudFront and API Gateway.
CERTIFICATE_ARN = "YOUR_ACM_CERTIFICATE_ARN"

app = App()

# Optionally, set your AWS account and region here
env = Environment(account=None, region=None)

# Look up the hosted zone and certificate from your AWS account
hosted_zone = route53.HostedZone.from_hosted_zone_attributes(
  app, "HostedZone",
  hosted_zone_id=HOSTED_ZONE_ID,
  zone_name=DOMAIN_NAME
)

certificate = acm.Certificate.from_certificate_arn(
  app, "Certificate",
  certificate_arn=CERTIFICATE_ARN
)

frontend_stack = FrontendStack(
  app, "FrontendStack",
  env=env,
  domain_name=DOMAIN_NAME,
  frontend_subdomain=FRONTEND_SUBDOMAIN,
  hosted_zone=hosted_zone,
  certificate=certificate
)

uploads_stack = UploadsStack(app, "UploadsStack", env=env)

backend_stack = BackendStack(
  app, "BackendStack",
  env=env,
  frontend_base_url=f"https://{FRONTEND_SUBDOMAIN}.{DOMAIN_NAME}",
  cookie_domain=f".{DOMAIN_NAME}",
  domain_name=DOMAIN_NAME,
  api_subdomain=API_SUBDOMAIN,
  hosted_zone=hosted_zone,
  certificate=certificate
)

app.synth()
