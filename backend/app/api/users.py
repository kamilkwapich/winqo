from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.db.models import User
from app.api.tenant_deps import current_user
from app.schemas.users import UpdateMeRequest, ChangePasswordRequest
from app.core.security import verify_password, hash_password

router = APIRouter(prefix="/users", tags=["users"])

@router.put("/me")
def update_me(payload: UpdateMeRequest, session: Session = Depends(get_session), user: User = Depends(current_user)):
    if payload.email and payload.email != user.email:
        existing = session.exec(select(User).where(User.email == payload.email)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email

    session.add(user)
    session.commit()
    session.refresh(user)
    return {"ok": True, "id": str(user.id), "email": user.email, "role": str(user.role), "tenant_id": str(user.tenant_id) if user.tenant_id else None}

@router.put("/me/password")
def change_password(payload: ChangePasswordRequest, session: Session = Depends(get_session), user: User = Depends(current_user)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.password_hash = hash_password(payload.new_password)
    session.add(user)
    session.commit()
    return {"ok": True}
