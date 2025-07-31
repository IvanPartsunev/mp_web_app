from aws_cdk import App, Environment

from stacks.frontend_stack import FrontendStack
from stacks.uploads_stack import UploadsStack
from stacks.backend_stack import BackendStack

app = App()

# Optionally, set your AWS account and region here
env = Environment(account=None, region=None)

frontend_stack = FrontendStack(app, "FrontendStack", env=env)
uploads_stack = UploadsStack(app, "UploadsStack", env=env)
backend_stack = BackendStack(app, "BackendStack", env=env)

app.synth()
