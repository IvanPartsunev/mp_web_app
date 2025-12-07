from enum import StrEnum


class UserRole(StrEnum):
  REGULAR_USER = "regular"
  BOARD = "board"
  CONTROL = "control"
  ACCOUNTANT = "accountant"
  ADMIN = "admin"


ROLE_HIERARCHY: dict[UserRole, list[UserRole]] = {
  UserRole.ADMIN: [UserRole.ADMIN, UserRole.CONTROL, UserRole.BOARD, UserRole.ACCOUNTANT, UserRole.REGULAR_USER],
  UserRole.CONTROL: [UserRole.CONTROL, UserRole.BOARD, UserRole.REGULAR_USER],
  UserRole.BOARD: [UserRole.BOARD, UserRole.REGULAR_USER],
  UserRole.ACCOUNTANT: [UserRole.ACCOUNTANT],
  UserRole.REGULAR_USER: [UserRole.REGULAR_USER],
}
