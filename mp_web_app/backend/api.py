import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app_config import FRONTEND_BASE_URL
from files.routers import file_router
from mail.routers import mail_router
from users.routers import user_router
from auth.routers import auth_router

FRONTEND_URL = os.environ.get("FRONTEND_BASE_URL", FRONTEND_BASE_URL)

app = FastAPI(docs_url="/api/docs", redoc_url="/api/redoc", openapi_url="/api/openapi.json")

app.add_middleware(
  CORSMiddleware,
  allow_origins=[f"{FRONTEND_URL}"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(user_router, prefix="/api/users")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(mail_router, prefix="/api/mail")
app.include_router(file_router, prefix="/api/files")

from mangum import Mangum

handler = Mangum(app)
