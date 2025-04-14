from fastapi import APIRouter
from fastapi.responses import HTMLResponse

user_router = APIRouter()
@user_router.post("/sign-up")
def user_sign_up():
  pass


@user_router.post("/sign-in")
def user_sign_in():
  pass


@user_router.post("/reset-password")
def user_reset_password():
  pass


@user_router.post("/activate-account")
def user_activate_account():
  pass

