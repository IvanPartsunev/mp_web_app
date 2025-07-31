from aws_cdk import (
  Stack,
  aws_s3 as s3,
  RemovalPolicy,
)
from constructs import Construct


class UploadsStack(Stack):
  def __init__(self, scope: Construct, id: str, **kwargs):
    super().__init__(scope, id, **kwargs)

    self.uploads_bucket = s3.Bucket(
      self, "UploadsBucket",
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for prod
      auto_delete_objects=True,  # Change for prod
    )

    from aws_cdk import CfnOutput
    CfnOutput(self, "UploadsBucketName", value=self.uploads_bucket.bucket_name)
