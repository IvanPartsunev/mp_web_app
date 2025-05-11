from fastapi import FastAPI

from mp_web_site.backend.users import routers

app = FastAPI(docs_url="/api/docs", redoc_url="/api/redoc")

app.include_router(routers.user_router, prefix="/api/users")
