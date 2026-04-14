from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

def create_access_token(subject: str, claims: dict, expires_minutes: int = 60 * 24) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
        **claims,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def create_payment_token(tenant_id: str, email: str, expires_minutes: int = 60 * 24 * 2) -> str:
    return create_access_token(subject=email, claims={"tid": tenant_id, "pay": True}, expires_minutes=expires_minutes)
