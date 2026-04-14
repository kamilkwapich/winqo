from fastapi import Depends, Header, HTTPException
from sqlmodel import Session, select
from uuid import UUID
from app.db.session import get_session
from app.db.models import User
from app.api.deps import decode_token
from app.core.roles import Role

def current_user(authorization: str = Header(...), session: Session = Depends(get_session)) -> User:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    uid = payload.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.get(User, UUID(uid))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")
    return user

def require_roles(*roles: Role):
    def _dep(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return _dep

def require_tenant(user: User = Depends(current_user)) -> UUID:
    if not user.tenant_id:
        raise HTTPException(status_code=403, detail="Tenant required")
    return user.tenant_id
