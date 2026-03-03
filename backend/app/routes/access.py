from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import User, HealthRecord, KeyEnvelope, UserRole
from app.services.audit_service import log_event

router = APIRouter(prefix="/records", tags=["access"])


class GrantAccessRequest(BaseModel):
    doctor_id: str
    wrapped_aes_key: str
    wrapped_pdf_key: Optional[str] = None


@router.post("/{record_id}/access", status_code=status.HTTP_201_CREATED)
def grant_access(record_id: str, payload: GrantAccessRequest, request: Request,
                 db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the record owner can grant access")

    doctor = db.query(User).filter(User.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if doctor.role not in [UserRole.doctor, UserRole.admin]:
        raise HTTPException(status_code=400, detail="Target user is not a doctor")

    existing = db.query(KeyEnvelope).filter(
        KeyEnvelope.record_id == record_id, KeyEnvelope.user_id == payload.doctor_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Access already granted")
    db.add(KeyEnvelope(
    record_id=record_id,
    user_id=payload.doctor_id,
    wrapped_aes_key=payload.wrapped_aes_key,
    wrapped_pdf_key=payload.wrapped_pdf_key,
    ))
    db.commit()

    log_event(db, "access_granted", user_id=current_user.id, record_id=record_id,
              details={"granted_to": doctor.name}, ip_address=request.client.host)

    return {"message": f"Access granted to {doctor.name}"}


@router.delete("/{record_id}/access/{user_id}")
def revoke_access(record_id: str, user_id: str, request: Request,
                  db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the record owner can revoke access")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own access")

    envelope = db.query(KeyEnvelope).filter(
        KeyEnvelope.record_id == record_id, KeyEnvelope.user_id == user_id
    ).first()
    if not envelope:
        raise HTTPException(status_code=404, detail="Access not found")

    revoked_user = db.query(User).filter(User.id == user_id).first()
    db.delete(envelope)
    db.commit()

    log_event(db, "access_revoked", user_id=current_user.id, record_id=record_id,
              details={"revoked_from": revoked_user.name if revoked_user else user_id}, ip_address=request.client.host)

    return {"message": "Access revoked"}


@router.get("/{record_id}/access")
def list_access(record_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    envelopes = db.query(KeyEnvelope).filter(KeyEnvelope.record_id == record_id).all()
    result = []
    for env in envelopes:
        user = db.query(User).filter(User.id == env.user_id).first()
        if user:
            result.append({"user_id": user.id, "name": user.name, "role": user.role, "granted_at": str(env.created_at)})
    return result