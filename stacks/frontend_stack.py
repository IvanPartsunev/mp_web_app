from aws_cdk import (
  Stack,
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_certificatemanager as acm,
  aws_route53 as route53,
  aws_route53_targets as route53_targets,
  RemovalPolicy,
  CfnOutput, Duration,
)
from constructs import Construct


class FrontendStack(Stack):
  def __init__(self, scope: Construct, id: str, domain_name: str, frontend_subdomain: str, hosted_zone: route53.IHostedZone, certificate: acm.ICertificate, **kwargs):
    super().__init__(scope, id, **kwargs)

    # 1. Create a PRIVATE S3 bucket for the frontend
    site_bucket = s3.Bucket(
      self, "FrontendSiteBucket",
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for prod
      auto_delete_objects=True,  # For dev/demo; remove for prod
    )

    # 2. Create a CloudFront Origin Access Identity (OAI)
    oai = cloudfront.OriginAccessIdentity(self, "FrontendOAI")

    # 3. Grant CloudFront OAI read access to the bucket
    site_bucket.grant_read(oai)

    self.frontend_url = f"https://{frontend_subdomain}.{domain_name}"

    # 4. Create a CloudFront distribution with the S3 bucket as the origin
    distribution = cloudfront.Distribution(
      self, "FrontendDistribution",
      default_behavior=cloudfront.BehaviorOptions(
        origin=origins.S3Origin(site_bucket, origin_access_identity=oai),
        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      ),
      default_root_object="index.html",
      domain_names=[f"{frontend_subdomain}.{domain_name}"],
      certificate=certificate,
      error_responses=[
        cloudfront.ErrorResponse(
          http_status=404,
          response_http_status=200,
          response_page_path="/index.html",
          ttl=Duration.minutes(0),  # optional, for instant updates
        )
      ],
    )

    # Create a Route 53 A record for the custom domain
    route53.ARecord(
        self,
        "FrontendDnsRecord",
        zone=hosted_zone,
        record_name=frontend_subdomain,
        target=route53.RecordTarget.from_alias(
            route53_targets.CloudFrontTarget(distribution)
        ),
    )

    # 5. Output the CloudFront URL and bucket name
    CfnOutput(self, "CloudFrontURL", value=self.frontend_url)
    CfnOutput(self, "SiteBucketName", value=site_bucket.bucket_name)
