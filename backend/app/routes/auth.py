from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import json

from app.core.database import get_db
from app.models.models import User, UserRole
from app.services.crypto_service import generate_keypair, serialize_public_key, encrypt_private_key
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.services.audit_service import log_event

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.patient


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    private_key, public_key = generate_keypair()
    protected = encrypt_private_key(private_key, payload.password)

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        public_key=serialize_public_key(public_key),
        encrypted_private_key=json.dumps({"ciphertext": protected["encrypted_private_key"], "iv": protected["iv"]}),
        salt=protected["salt"],
        is_active="false" if payload.role == UserRole.doctor else "true",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_event(db, "user_registered", user_id=user.id, details={"email": user.email, "role": str(user.role)}, ip_address=request.client.host)

    return {
        "message": "Registered successfully" + (" — awaiting admin approval" if payload.role == UserRole.doctor else ""),
        "user_id": user.id,
        "role": user.role,
    }


@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        log_event(db, "user_login_failed", details={"email": payload.email}, ip_address=request.client.host)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.is_active != "true":
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    key_blob = json.loads(user.encrypted_private_key)
    token = create_access_token(user.id, user.role)

    log_event(db, "user_login", user_id=user.id, ip_address=request.client.host)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        # Sent to client so browser can decrypt private key locally
        "encrypted_private_key": key_blob["ciphertext"],
        "salt": user.salt,
        "private_key_iv": key_blob["iv"],
    }