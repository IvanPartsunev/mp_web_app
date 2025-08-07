from aws_cdk import (
  Stack,
  aws_lambda as _lambda,
  aws_iam as iam,
  aws_apigateway as apigateway,
  aws_dynamodb as dynamodb,
  aws_secretsmanager as secretsmanager,
  RemovalPolicy,
  Duration,
  CfnOutput,
)
from constructs import Construct
import os


class BackendStack(Stack):
  def __init__(self, scope: Construct, id: str, frontend_base_url: str = "", **kwargs):
    super().__init__(scope, id, **kwargs)

    # Create a randomly generated JWT secret
    self.jwt_secret = secretsmanager.Secret(
      self, "JwtSecret",
      secret_name="fastapi/jwt_secret",
      description="JWT signing secret for the backend",
      generate_secret_string=secretsmanager.SecretStringGenerator(
        secret_string_template='{"JWT_SECRET": ""}',
        generate_string_key="JWT_SECRET",
        exclude_characters="'\"\\",
        password_length=64
      )
    )
    # DynamoDB tables
    self.table1 = dynamodb.TableV2(
      self, "users_table",
      table_name="users_table",
      partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
      billing=dynamodb.Billing.provisioned(
        read_capacity=dynamodb.Capacity.fixed(2),
        write_capacity=dynamodb.Capacity.autoscaled(max_capacity=2)
      ),
      removal_policy=RemovalPolicy.RETAIN,
    )
    self.table1.add_global_secondary_index(
      index_name="email_index",
      partition_key=dynamodb.Attribute(name="email", type=dynamodb.AttributeType.STRING)
    )

    self.table2 = dynamodb.TableV2(
      self, "user_codes_table",
      table_name="user_codes_table",
      partition_key=dynamodb.Attribute(name="user_code", type=dynamodb.AttributeType.STRING),
      billing=dynamodb.Billing.provisioned(
        read_capacity=dynamodb.Capacity.fixed(2),
        write_capacity=dynamodb.Capacity.autoscaled(max_capacity=2)
      ),
      removal_policy=RemovalPolicy.RETAIN,
    )
    self.table3 = dynamodb.TableV2(
      self, "refresh_table",
      table_name="refresh_table",
      partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
      billing=dynamodb.Billing.provisioned(
        read_capacity=dynamodb.Capacity.fixed(2),
        write_capacity=dynamodb.Capacity.autoscaled(max_capacity=2)
      ),
      removal_policy=RemovalPolicy.DESTROY,
      time_to_live_attribute="expires_at",
    )

    # Lambda function with dependencies bundled directly
    self.backend_lambda = _lambda.Function(
      self, "BackendLambda",
      runtime=_lambda.Runtime.PYTHON_3_12,
      handler="api.handler",
      code=_lambda.Code.from_asset(
        os.path.join("mp_web_app", "backend"),
        bundling={
          "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
          "command": [
            "bash", "-c",
            # Use pip with platform/implementation flags for native deps
            "pip install --platform manylinux2014_x86_64 --target=/asset-output --implementation cp --only-binary=:all: --upgrade -r requirements.txt && "
            "cp -r . /asset-output/"
          ],
          "user": "root",
        },
      ),
      timeout=Duration.seconds(30),
      memory_size=1024,
      environment={
        "FRONTEND_BASE_URL": frontend_base_url or "https://d3u6t9h0xyyd0j.cloudfront.net",
        "USERS_TABLE_NAME": self.table1.table_name,
        "USER_CODES_TABLE_NAME": self.table2.table_name,
        "REFRESH_TABLE_NAME": self.table3.table_name,
        "MAIL_SENDER": "office@murdjovpojar.com",
        "JWT_SECRET_ARN": self.jwt_secret.secret_arn,
        "JWT_ALGORITHM": "HS256",
      }
    )

    # Give lambda permissions to read the secret
    self.jwt_secret.grant_read(self.backend_lambda)

    # API Gateway to expose Lambda
    self.api = apigateway.LambdaRestApi(
      self, "BackendApi",
      handler=self.backend_lambda,
      proxy=True,
      deploy_options=apigateway.StageOptions(stage_name="prod"),
    )

    # Grant Lambda access to tables
    self.table1.grant_read_write_data(self.backend_lambda)
    self.table2.grant_read_write_data(self.backend_lambda)
    self.table3.grant_read_write_data(self.backend_lambda)

    # Grant Lambda access to SES
    self.backend_lambda.add_to_role_policy(
      iam.PolicyStatement(
        actions=["ses:SendEmail", "ses:SendRawEmail"],
        resources=["*"]  # Or restrict to your SES identity ARN
      )
    )

    # Outputs
    CfnOutput(self, "ApiUrl", value=self.api.url)
    CfnOutput(self, "Table1Name", value=self.table1.table_name)
    CfnOutput(self, "Table2Name", value=self.table2.table_name)
    CfnOutput(self, "Table3Name", value=self.table3.table_name)
