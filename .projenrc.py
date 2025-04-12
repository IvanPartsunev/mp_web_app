from projen.python import PythonProject

project = PythonProject(
    author_email="ivan.partsunev@linkin.eu",
    author_name="ivanparcunev",
    module_name="mp_web_site",
    name="mp-web-site",
    version="0.1.0",
)

project.synth()