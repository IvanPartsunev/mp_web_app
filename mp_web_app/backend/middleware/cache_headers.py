# middleware/cache_headers.py
"""
Middleware to add cache control headers to responses.
"""

from collections.abc import Callable
from typing import ClassVar

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class CacheControlMiddleware(BaseHTTPMiddleware):
  """
  Middleware that adds Cache-Control headers based on the endpoint.
  """

  # Cache tiers aligned with React Query staleTime on the frontend:
  #   static      (1h)  — public, rarely changing: gallery, products, board/control
  #   semi-static (30m) — private, auth-gated, infrequently changing: members
  #   dynamic     (5m)  — private, auth-gated, occasionally changing: news, files
  #   no-cache          — admin-only or sensitive: users/list
  CACHE_POLICIES: ClassVar[dict[str, str]] = {
    # static tier (1 hour)
    "gallery/list": "public, max-age=3600, stale-while-revalidate=7200",
    "products/list": "public, max-age=3600, stale-while-revalidate=7200",
    "users/board": "public, max-age=3600, stale-while-revalidate=7200",
    "users/control": "public, max-age=3600, stale-while-revalidate=7200",
    # semi-static tier (30 minutes) — private: response varies by auth token
    "members/list": "private, max-age=1800, stale-while-revalidate=3600",
    # dynamic tier (5 minutes) — private: response varies by auth token
    "news/list": "private, max-age=300, stale-while-revalidate=600",
    "files/list": "private, max-age=300, stale-while-revalidate=600",
    # no-cache tier — admin-only endpoint, must never be cached
    "users/list": "no-store",
  }

  async def dispatch(self, request: Request, call_next: Callable) -> Response:
    response = await call_next(request)

    # Only cache GET requests with successful responses
    if request.method == "GET" and 200 <= response.status_code < 300:
      path = request.url.path.removeprefix("/api/")

      # Check if this path has a cache policy
      for pattern, cache_control in self.CACHE_POLICIES.items():
        if pattern in path:
          response.headers["Cache-Control"] = cache_control
          # Vary by Authorization to cache authenticated vs public separately
          response.headers["Vary"] = "Authorization"
          break
      else:
        # Default: no-store for unmatched GET endpoints
        response.headers["Cache-Control"] = "no-store"
    else:
      # Never cache mutations or error responses
      response.headers["Cache-Control"] = "no-store"

    return response
