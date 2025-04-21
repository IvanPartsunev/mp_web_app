from datetime import datetime
from tomllib._types import Key
from typing import Optional, List
from uuid import uuid4
from zoneinfo import ZoneInfo

from mp_web_site.mp_api.modules.users.models import UserCreate, User, UserUpdate


async def create_user(self, user_data: UserCreate) -> User:
  """Create a new user in DynamoDB."""
  user_id = str(uuid4())
  now= datetime.now(ZoneInfo("Europe/Helsinki"))

  user_item = {
    'id': user_id,
    'email': user_data.email,
    'phone': user_data.phone,
    'role': user_data.role,
    'active': user_data.active,
    'created_at': now,
    'updated_at': now
    # In a real application, you would hash the password before storing
    # 'password_hash': hash_password(user_data.password)
  }

  self.table.put_item(Item=user_item)

  return self._convert_to_user(user_item)


async def get_user_by_id(self, user_id: str) -> Optional[User]:
  """Get a user by ID from DynamoDB."""
  response = self.table.get_item(Key={'id': user_id})

  if 'Item' not in response:
    return None

  return self._convert_to_user(response['Item'])


async def get_user_by_email(self, email: str) -> Optional[User]:
  """Get a user by email from DynamoDB using the GSI."""
  response = self.table.query(
    IndexName='email-index',
    KeyConditionExpression=Key('email').eq(email)
  )

  if not response['Items']:
    return None

  return self._convert_to_user(response['Items'][0])


async def list_users(self) -> List[User]:
  """List all users from DynamoDB."""
  response = self.table.scan()

  return [self._convert_to_user(item) for item in response['Items']]


async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[User]:
  """Update a user in DynamoDB."""
  # First, check if the user exists
  existing_user = await self.get_user_by_id(user_id)
  if not existing_user:
    return None

  # Build update expression
  update_expression_parts = []
  expression_attribute_values = {}
  expression_attribute_names = {}

  # Add updated_at timestamp
  update_expression_parts.append("#updated_at = :updated_at")
  expression_attribute_values[":updated_at"] = datetime.utcnow().isoformat()
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

  # Build the update expression
  update_expression = "SET " + ", ".join(update_expression_parts)

  # Update the item
  response = self.table.update_item(
    Key={'id': user_id},
    UpdateExpression=update_expression,
    ExpressionAttributeValues=expression_attribute_values,
    ExpressionAttributeNames=expression_attribute_names,
    ReturnValues="ALL_NEW"
  )

  return self._convert_to_user(response['Attributes'])


async def delete_user(self, user_id: str) -> bool:
  """Delete a user from DynamoDB."""
  # First, check if the user exists
  existing_user = await self.get_user_by_id(user_id)
  if not existing_user:
    return False

  self.table.delete_item(Key={'id': user_id})
  return True
