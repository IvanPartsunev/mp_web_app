import os

from botocore.exceptions import ClientError
from fastapi import HTTPException

from database.repositories import MemberRepository
from users.models import Member
from users.operations import validate_email, validate_phone

MEMBERS_TABLE_NAME = os.environ.get('MEMBERS_TABLE_NAME')


def get_member_repository() -> MemberRepository:
  """Dependency to get the member repository."""
  return MemberRepository(MEMBERS_TABLE_NAME)


def is_member_code_valid(member_code: str, repo: MemberRepository) -> Member | None:
  response = repo.table.get_item(Key={"member_code": member_code})

  if 'Item' not in response or not response['Item'].get('is_valid', None):
    return None
  return repo.convert_item_to_object(response['Item'])


def create_member(member: Member, repo: MemberRepository):

  member_item = {
    'first_name': member.first_name,
    'last_name': member.last_name,
    'email': validate_email(member.email) if member.email else None,
    'phone': validate_phone(member.phone) if member.phone else None,
    'proxy': member.proxy,
    'member_code': member.member_code,
    'member_code_valid': True,
  }
  try:
    repo.table.put_item(Item=member_item)
  except ClientError as e:
    raise HTTPException(
      status_code=500,
      detail=f"Database error: {e.response['Error']['Message']}"
    )


def update_member_code(member_code: str, repo: MemberRepository) -> None:
  response = repo.table.get_item(Key={"member_code": member_code})
  member_obj = repo.convert_item_to_object(response["Item"])
  response = repo.table.update_item(
    Key={'member_code': member_obj.member_code},
    UpdateExpression='SET #is_valid = :is_valid',
    ExpressionAttributeNames={'#is_valid': 'is_valid'},
    ExpressionAttributeValues={':is_valid': not member_obj.is_valid},
    ReturnValues="ALL_NEW"
  )
  return repo.convert_item_to_object(response["Attributes"])


def is_valid_file_type(file_name: str):
  if not file_name.endswith(".pdf"):
    raise ValueError("Invalid members list file type. Allowed type: ['.pdf']")
