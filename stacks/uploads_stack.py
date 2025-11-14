from aws_cdk import (
  Stack,
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  RemovalPolicy,
  CfnOutput,
  Duration,
)
from constructs import Construct


class UploadsStack(Stack):
  def __init__(self, scope: Construct, id: str, **kwargs):
    super().__init__(scope, id, **kwargs)

    # S3 bucket for uploads (gallery images, documents, etc.)
    self.uploads_bucket = s3.Bucket(
      self, "UploadsBucket",
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.RETAIN,
      auto_delete_objects=False,
    )

    # Create CloudFront Origin Access Identity for uploads bucket
    uploads_oai = cloudfront.OriginAccessIdentity(
      self, "UploadsOAI",
      comment="OAI for uploads bucket (gallery images, documents)"
    )

    # Grant CloudFront OAI read access to the uploads bucket
    self.uploads_bucket.grant_read(uploads_oai)

    # Create CloudFront distribution for uploads/gallery
    self.uploads_distribution = cloudfront.Distribution(
      self, "UploadsDistribution",
      comment="CDN for gallery images and uploads",
      default_behavior=cloudfront.BehaviorOptions(
        origin=origins.S3Origin(
          self.uploads_bucket,
          origin_access_identity=uploads_oai
        ),
        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress=True,
      ),
      # Price class - use PriceClass_100 for US/Canada/Europe only (cheaper)
      # or PriceClass_ALL for worldwide
      price_class=cloudfront.PriceClass.PRICE_CLASS_100,
    )

    # Outputs
    CfnOutput(self, "UploadsBucketName", value=self.uploads_bucket.bucket_name)
    CfnOutput(
      self, "UploadsCloudFrontDomain",
      value=self.uploads_distribution.distribution_domain_name,
      description="CloudFront domain for uploads/gallery"
    )
    CfnOutput(
      self, "UploadsDistributionId",
      value=self.uploads_distribution.distribution_id,
      description="CloudFront distribution ID for cache invalidation"
    )
