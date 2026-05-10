import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app_config import FRONTEND_BASE_URL
from auth.routers import auth_router
from files.routers import file_router
from gallery.routers import gallery_router
from mail.routers import mail_router
from members.routers import member_router
from middleware.cache_headers import CacheControlMiddleware
from news.routers import news_router
from products.routers import product_router
from users.routers import user_router

FRONTEND_URL = os.environ.get("FRONTEND_BASE_URL", FRONTEND_BASE_URL)


# Allow both www and non-www variants of the frontend URL
def get_allowed_origins(url: str) -> list[str]:
  origins = [url]
  if url.startswith("https://www."):
    origins.append(url.replace("https://www.", "https://", 1))
  elif url.startswith("https://") and not url.startswith("https://www."):
    origins.append(url.replace("https://", "https://www.", 1))
  return origins


app = FastAPI(docs_url="/api/docs", redoc_url="/api/redoc", openapi_url="/api/openapi.json")

app.add_middleware(
  CORSMiddleware,
  allow_origins=get_allowed_origins(FRONTEND_URL),
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Add cache control middleware
app.add_middleware(CacheControlMiddleware)

app.include_router(user_router, prefix="/api/users")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(mail_router, prefix="/api/mail")
app.include_router(file_router, prefix="/api/files")
app.include_router(news_router, prefix="/api/news")
app.include_router(gallery_router, prefix="/api/gallery")
app.include_router(member_router, prefix="/api/members")
app.include_router(product_router, prefix="/api/products")

from mangum import Mangum

handler = Mangum(app, lifespan="off", api_gateway_base_path="/")
