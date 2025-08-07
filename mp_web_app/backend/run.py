import secrets
import base64

key = secrets.token_bytes(32)  # 256 bits
jwt_secret = base64.urlsafe_b64encode(key).decode()
print(jwt_secret)
