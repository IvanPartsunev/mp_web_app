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

  # Define cache policies for different endpoint patterns
  CACHE_POLICIES: ClassVar[dict[str, str]] = {
    # Long cache (1 hour) - rarely changing data
    "products/list": "public, max-age=3600, stale-while-revalidate=7200",
    "gallery/list": "public, max-age=3600, stale-while-revalidate=7200",
    "users/board": "public, max-age=3600, stale-while-revalidate=7200",
    "users/control": "public, max-age=3600, stale-while-revalidate=7200",
    "members/list": "public, max-age=3600, stale-while-revalidate=7200",
    "files/list": "public, max-age=3600, stale-while-revalidate=7200",
    # Medium cache (10 minutes) - occasionally changing data
    "news/list": "public, max-age=600, stale-while-revalidate=1200",
    # Short cache (5 minutes) - admin panel data
    "users/list": "private, max-age=300, stale-while-revalidate=600",
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
        # Default: no cache for unmatched GET endpoints
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    else:
      # Never cache mutations or errors
      response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
      response.headers["Pragma"] = "no-cache"
      response.headers["Expires"] = "0"

    return response
