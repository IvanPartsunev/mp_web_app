from fastapi import FastAPI

from mp_web_site.backend.mail.routers import mail_router
from mp_web_site.backend.users.routers import user_router
from mp_web_site.backend.auth.routers import auth_router

app = FastAPI(docs_url="/api/docs", redoc_url="/api/redoc")

app.include_router(user_router, prefix="/api/users")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(mail_router, prefix="/api/mail")