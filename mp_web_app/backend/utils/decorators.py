import functools
import random
import time


def retry(num_retry: int = 3, base_delay: float = 1.0, max_delay: float = 30.0, jitter: bool = True):
  """
  Retry decorator with exponential backoff and optional jitter.

  Args:
      num_retry (int): Number of retry attempts.
      base_delay (float): Initial delay before first retry in seconds.
      max_delay (float): Maximum delay cap in seconds.
      jitter (bool): If True, adds random jitter to spread retries.
  """

  def decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
      first_exception = None
      for attempt in range(num_retry):
        try:
          return func(*args, **kwargs)
        except Exception as e:
          if first_exception is None:
            first_exception = e
          delay = min(base_delay * (2**attempt), max_delay)
          if jitter:
            delay = random.uniform(0, delay)
          time.sleep(delay)
      raise first_exception

    return wrapper

  return decorator
