class WrongCredentialsException(Exception):
  ...


class RefreshTokenDoesNotExistException(Exception):
  ...


class ExpiredRefreshTokenException(Exception):
  ...