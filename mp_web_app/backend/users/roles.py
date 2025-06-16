from enum import StrEnum
from typing import List


class UserRole(StrEnum):
  REGULAR_USER = "regular"
  BOARD = "board"
  CONTROL = "control"
  ADMIN = "admin"


ROLE_HIERARCHY: dict[UserRole, List[UserRole]] = {
    UserRole.ADMIN: [UserRole.ADMIN, UserRole.CONTROL, UserRole.BOARD, UserRole.REGULAR_USER],
    UserRole.CONTROL: [UserRole.CONTROL, UserRole.BOARD, UserRole.REGULAR_USER],
    UserRole.BOARD: [UserRole.BOARD, UserRole.REGULAR_USER],
    UserRole.REGULAR_USER: [UserRole.REGULAR_USER],
}