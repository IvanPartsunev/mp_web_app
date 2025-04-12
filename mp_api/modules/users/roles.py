from enum import StrEnum


class UserRole(StrEnum):
  REGULAR_USER = "regular"
  BOARD = "board"
  CONTROL = "control"
  ADMIN = "admin"