from pydantic import BaseModel
from typing import Optional

class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None
    user: dict