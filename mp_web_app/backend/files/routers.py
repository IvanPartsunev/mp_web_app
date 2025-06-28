from fastapi import APIRouter, HTTPException

file_router = APIRouter(tags=["files"])

@file_router.post("/upload")
async def upload_files():
  return HTTPException(status_code=204, detail="Not implemented")


@file_router.get("/get_files")
async def get_files():
  return HTTPException(status_code=204, detail="Not implemented")


@file_router.post("/delete_files")
async def delete_files():
  return HTTPException(status_code=204, detail="Not implemented")