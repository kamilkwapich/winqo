from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from sqlmodel import Session, select
from app.db.session import get_session
from app.core.config import settings
from app.db.models import User
from app.core.roles import Role

def get_current_user(session: Session = Depends(get_session), authorization: str | None = None):
    # FastAPI doesn't auto-inject headers here; use a dependency in routes (see below).
    raise NotImplementedError

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], audience=settings.jwt_audience, issuer=settings.jwt_issuer)
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from e

def require_role(*roles: Role):
    def _inner(user: User):
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user
    return _inner
