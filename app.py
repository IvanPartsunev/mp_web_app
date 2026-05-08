from aws_cdk import App, Environment, Stack
from aws_cdk import aws_route53 as route53
from aws_cdk import aws_certificatemanager as acm

from stacks.frontend_stack import FrontendStack
from stacks.uploads_stack import UploadsStack
from stacks.backend_stack import BackendStack

# --- Configuration ---

# 1. Domain name.
DOMAIN_NAME = "murdjovpojar.com"

# 2. Subdomains for frontend and backend.
FRONTEND_SUBDOMAIN = "www"
API_SUBDOMAIN = "api"

# 3. The Hosted Zone ID for domain from AWS Route 53.
HOSTED_ZONE_ID = "Z0052226BNBL8QXSJIMI"

# 4. The ARN of ACM Certificate.
CERTIFICATE_ARN = "arn:aws:acm:us-east-1:334317073615:certificate/9f5708b3-a287-483b-b9c6-9863dbfe141a"


class DomainLookupStack(Stack):
  def __init__(self, scope: App, id: str, **kwargs) -> None:
    super().__init__(scope, id, **kwargs)

    self.hosted_zone = route53.HostedZone.from_hosted_zone_attributes(
      self, "HostedZone",
      hosted_zone_id=HOSTED_ZONE_ID,
      zone_name=DOMAIN_NAME
    )

    self.certificate = acm.Certificate.from_certificate_arn(
      self, "Certificate",
      certificate_arn=CERTIFICATE_ARN
    )


app = App()

# Optionally, set your AWS account and region here
env = Environment(account=None, region=None)

# Create the stack that looks up domain resources
domain_stack = DomainLookupStack(app, "DomainLookupStack", env=env)

# Create the frontend stack, passing in the domain resources
frontend_stack = FrontendStack(
  app, "FrontendStack",
  env=env,
  domain_name=DOMAIN_NAME,
  frontend_subdomain=FRONTEND_SUBDOMAIN,
  hosted_zone=domain_stack.hosted_zone,
  certificate=domain_stack.certificate
)

# Create the uploads stack
uploads_stack = UploadsStack(app, "UploadsStack", env=env)

# Create the backend stack, passing in the domain resources AND uploads CloudFront domain
backend_stack = BackendStack(
  app, "BackendStack",
  env=env,
  frontend_base_url=f"https://{FRONTEND_SUBDOMAIN}.{DOMAIN_NAME}",
  cookie_domain=f".{DOMAIN_NAME}",
  domain_name=DOMAIN_NAME,
  api_subdomain=API_SUBDOMAIN,
  hosted_zone=domain_stack.hosted_zone,
  certificate=domain_stack.certificate,
  uploads_cloudfront_domain=uploads_stack.uploads_distribution.distribution_domain_name,  # Pass CloudFront domain
  uploads_distribution_id=uploads_stack.uploads_distribution.distribution_id,  # Pass distribution ID
  uploads_bucket_name=uploads_stack.uploads_bucket.bucket_name,  # Pass bucket name dynamically
)

app.synth()
