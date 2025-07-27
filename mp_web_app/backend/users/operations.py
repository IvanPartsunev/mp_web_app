import logging
import re
from datetime import datetime

from boto3.dynamodb.conditions import Key

from typing import Optional, List
from uuid import uuid4

from botocore.exceptions import ClientError
from fastapi import HTTPException, Request
from pydantic import EmailStr

from database.operations import UserRepository
from users.models import UserCreate, User, UserUpdate, UserSecret, UserUpdatePassword
from users.roles import UserRole


def get_user_repository() -> UserRepository:
  """Dependency to get the user repository."""
  return UserRepository()


def hash_password(password: str, salt: str) -> str:
  from argon2 import PasswordHasher
  ph = PasswordHasher()
  password_with_salt = password + str(salt)
  hashed_password = ph.hash(password_with_salt)
  return hashed_password


def verify_password(password_hash: str, password: str, salt: str) -> bool:
  from argon2 import exceptions, PasswordHasher

  ph = PasswordHasher()
  password_with_salt = password + str(salt)
  try:
    return ph.verify(password_hash, password_with_salt)
  except (exceptions.VerifyMismatchError, exceptions.VerificationError):
    return False


def validate_password(password):
  if len(password) > 30:
    raise ValueError("Password must be at less than 30 characters long")
  if len(password) < 8:
    raise ValueError("Password must be at least 8 characters long")
  if not re.search(r'[A-Z]', password):
    raise ValueError("Password must contain at least one uppercase letter")
  if not re.search(r'[a-z]', password):
    raise ValueError("Password must contain at least one lowercase letter")
  if not re.search(r'[0-9]', password):
    raise ValueError("Password must contain at least one digit")
  if not re.search(r'[!@#$%^&?]', password):
    raise ValueError("Password must contain at least one special symbol: !@#$%^&?")

  return password


def create_user(user_data: UserCreate, request: Request, repo: UserRepository) -> User:
  """Create a new user in DynamoDB."""

  user_id = str(uuid4())
  user_role = UserRole.REGULAR_USER.value
  active = False
  salt = str(uuid4())[:8]
  created_at: datetime = datetime.now()
  updated_at: datetime = datetime.now()
  password = user_data.password
  validate_password(password=password)
  hashed_password = hash_password(user_data.password, salt)

  # TODO: Make validations for phone number, and password
  user_item = {
    "id": user_id,
    "email": user_data.email,
    "phone": user_data.phone,
    "role": user_role,
    "user_code": "",
    "active": active,
    "created_at": created_at.isoformat(),
    "updated_at": updated_at.isoformat(),
    "salt": salt,
    "password_hash": hashed_password,
    "subscribed": True
  }

  try:
    repo.table.put_item(Item=user_item)
  except ClientError as e:
    logging.error(f"DynamoDB ClientError: {e.response['Error']['Message']}")
    raise HTTPException(
      status_code=500,
      detail=f"Database error: {e.response['Error']['Message']}"
    )
  except Exception as e:
    logging.error(f"Unexpected error: {str(e)}")
    raise HTTPException(
      status_code=500,
      detail="An unexpected error occurred while creating the user."
    )

  return repo.convert_item_to_user(user_item)


def get_user_by_id(user_id: str, repo: UserRepository, secret: bool = False) -> Optional[User | UserSecret]:
  """Get a user by ID from DynamoDB."""
  response = repo.table.get_item(Key={"id": user_id})

  if "Item" not in response:
    return None

  if secret:
    return repo.convert_item_to_user_secret(response["Item"])
  return repo.convert_item_to_user(response["Item"])


def get_user_by_email(email: EmailStr | str, repo: UserRepository, secret: bool = False) -> Optional[User | UserSecret]:
  """Get a user by email from DynamoDB using the GSI."""
  response = repo.table.query(
    IndexName="email-index",
    KeyConditionExpression=Key("email").eq(email)
  )

  if not response["Items"]:
    return None

  if secret:
    return repo.convert_item_to_user_secret(response["Items"][0])
  return repo.convert_item_to_user(response["Items"][0])


def list_users(self) -> List[User]:
  """List all users from DynamoDB."""
  response = self.table.scan()

  return [self._convert_to_user(item) for item in response["Items"]]


def update_user(user_id: str, user_email: EmailStr | str, user_data: UserUpdate, repo: UserRepository) -> Optional[
  User]:
  """Update a user in DynamoDB."""

  existing_user = get_user_by_email(user_email, repo)
  if not existing_user:
    return None

  # Build update expression
  update_expression_parts = []
  expression_attribute_values = {}
  expression_attribute_names = {}

  # Add updated_at timestamp
  update_expression_parts.append("#updated_at = :updated_at")
  expression_attribute_values[":updated_at"] = datetime.now().isoformat()
  expression_attribute_names["#updated_at"] = "updated_at"

  # Add other fields if they are provided
  if user_data.email is not None:
    update_expression_parts.append("#email = :email")
    expression_attribute_values[":email"] = user_data.email
    expression_attribute_names["#email"] = "email"

  if user_data.phone is not None:
    update_expression_parts.append("#phone = :phone")
    expression_attribute_values[":phone"] = user_data.phone
    expression_attribute_names["#phone"] = "phone"

  if user_data.role is not None:
    update_expression_parts.append("#role = :role")
    expression_attribute_values[":role"] = user_data.role
    expression_attribute_names["#role"] = "role"

  if user_data.active is not None:
    update_expression_parts.append("#active = :active")
    expression_attribute_values[":active"] = user_data.active
    expression_attribute_names["#active"] = "active"

  if user_data.subscribed is not None:
    update_expression_parts.append("#subscribed = :subscribed")
    expression_attribute_values[":subscribed"] = user_data.subscribed
    expression_attribute_names["#subscribed"] = "subscribed"

  # Build the update expression
  update_expression = "SET " + ", ".join(update_expression_parts)

  # Update the item
  response = repo.table.update_item(
    Key={"id": user_id},
    UpdateExpression=update_expression,
    ExpressionAttributeValues=expression_attribute_values,
    ExpressionAttributeNames=expression_attribute_names,
    ReturnValues="ALL_NEW",
  )

  return repo.convert_item_to_user(response["Attributes"])


def update_user_password(user_id: str, user_email: EmailStr | str, user_data: UserUpdatePassword,
                         repo: UserRepository) -> Optional[
  User]:
  """Update the user's password in DynamoDB."""

  existing_user = get_user_by_email(user_email, repo, secret=True)
  if not existing_user:
    return None

  password = user_data.password
  hashed_password = hash_password(password, existing_user.salt)

  update_expression_parts = []
  expression_attribute_values = {}
  expression_attribute_names = {}

  update_expression_parts.append("#updated_at = :updated_at")
  expression_attribute_values[":updated_at"] = datetime.now().isoformat()
  expression_attribute_names["#updated_at"] = "updated_at"

  update_expression_parts.append("#password = :password")
  expression_attribute_values[":password"] = hashed_password
  expression_attribute_names["#password"] = "password_hash"

  update_expression = "SET " + ", ".join(update_expression_parts)

  response = repo.table.update_item(
    Key={"id": user_id},
    UpdateExpression=update_expression,
    ExpressionAttributeValues=expression_attribute_values,
    ExpressionAttributeNames=expression_attribute_names,
    ReturnValues="ALL_NEW"
  )
  return repo.convert_item_to_user(response["Attributes"])


def delete_user(user_id: str, repo: UserRepository) -> bool:
  """Delete a user from DynamoDB."""
  # First, check if the user exists
  existing_user = get_user_by_id(user_id, repo)
  if not existing_user:
    return False

  repo.table.delete_item(Key={"id": user_id})
  return True
