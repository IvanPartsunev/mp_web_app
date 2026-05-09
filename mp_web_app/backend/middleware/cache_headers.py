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
  #   semi-static (5m)  — public/private, infrequently changing: gallery, products, members, files, board/control
  #   dynamic     (2m)  — private, occasionally changing: news
  #   no-cache          — admin-only or sensitive: users/list, any request with X-Admin-Request header
  #
  # Admin requests send X-Admin-Request: true — always bypasses cache regardless of endpoint.
  # This ensures mutations are immediately visible in the admin panel after React Query invalidation.
  CACHE_POLICIES: ClassVar[dict[str, str]] = {
    # semi-static tier (5 minutes) — public, infrequently changing
    "gallery/list": "public, max-age=300, stale-while-revalidate=600",
    "products/list": "public, max-age=300, stale-while-revalidate=600",
    "users/board": "public, max-age=300, stale-while-revalidate=600",
    "users/control": "public, max-age=300, stale-while-revalidate=600",
    # semi-static tier (5 minutes) — private: response varies by auth token
    "members/list": "private, max-age=300, stale-while-revalidate=600",
    "files/list": "private, max-age=300, stale-while-revalidate=600",
    # dynamic tier (2 minutes) — private: news varies by auth token
    "news/list": "private, max-age=120, stale-while-revalidate=240",
    # no-cache tier — admin-only endpoint, must never be cached
    "users/list": "no-store",
  }

  async def dispatch(self, request: Request, call_next: Callable) -> Response:
    response = await call_next(request)

    # Only cache GET requests with successful responses
    if request.method == "GET" and 200 <= response.status_code < 300:
      # Admin requests always bypass the browser cache so mutations are immediately visible
      if request.headers.get("X-Admin-Request") == "true":
        response.headers["Cache-Control"] = "no-store"
      else:
        path = request.url.path.removeprefix("/api/")

        # Check if this path has a cache policy
        for pattern, cache_control in self.CACHE_POLICIES.items():
          if pattern in path:
            response.headers["Cache-Control"] = cache_control
            # Vary by Authorization (auth vs public) and X-Admin-Request (admin bypass)
            response.headers["Vary"] = "Authorization, X-Admin-Request"
            break
        else:
          # Default: no-store for unmatched GET endpoints
          response.headers["Cache-Control"] = "no-store"
    else:
      # Never cache mutations or error responses
      response.headers["Cache-Control"] = "no-store"

    return response
