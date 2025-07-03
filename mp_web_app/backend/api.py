from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from files.routers import file_router
from mail.routers import mail_router
from users.routers import user_router
from auth.routers import auth_router

app = FastAPI(docs_url="/api/docs", redoc_url="/api/redoc")

app.add_middleware(  # type: ignore
  CORSMiddleware,
  allow_origins=["http://localhost:3000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(user_router, prefix="/api/users")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(mail_router, prefix="/api/mail")
app.include_router(file_router, prefix="/api/files")
