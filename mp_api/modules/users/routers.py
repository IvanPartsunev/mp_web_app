from fastapi import APIRouter

user_router = APIRouter()
@user_router.post("/sign-up")
def user_sign_up():
  pass

@user_router.post("/sign-in")
def user_sign_in():
  pass