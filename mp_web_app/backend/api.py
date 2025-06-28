from fastapi import FastAPI

from files.routers import file_router
from mail.routers import mail_router
from users.routers import user_router
from auth.routers import auth_router

app = FastAPI(docs_url="/api/docs", redoc_url="/api/redoc")

app.include_router(user_router, prefix="/api/users")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(mail_router, prefix="/api/mail")
app.include_router(file_router, prefix="/api/files")