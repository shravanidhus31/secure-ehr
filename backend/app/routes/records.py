from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import User, HealthRecord, KeyEnvelope
from app.services.audit_service import log_event

router = APIRouter(prefix="/records", tags=["records"])


class CreateRecordRequest(BaseModel):
    encrypted_data: str
    iv: str
    wrapped_aes_key: str
    record_type: str
    title: str
    owner_id: Optional[str] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_record(payload: CreateRecordRequest, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owner_id = payload.owner_id if payload.owner_id else current_user.id

    if owner_id != current_user.id:
        owner = db.query(User).filter(User.id == owner_id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Patient not found")

    record = HealthRecord(
        owner_id=owner_id,
        created_by=current_user.id,
        encrypted_data=payload.encrypted_data,
        iv=payload.iv,
        record_type=payload.record_type,
        title=payload.title,
    )
    db.add(record)
    db.flush()

    envelope = KeyEnvelope(record_id=record.id, user_id=current_user.id, wrapped_aes_key=payload.wrapped_aes_key)
    db.add(envelope)
    db.commit()
    db.refresh(record)

    log_event(db, "record_created", user_id=current_user.id, record_id=record.id,
              details={"record_type": record.record_type, "title": record.title}, ip_address=request.client.host)

    return {"message": "Record created", "record_id": record.id}


@router.get("/")
def list_records(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    envelopes = db.query(KeyEnvelope).filter(KeyEnvelope.user_id == current_user.id).all()
    record_ids = [e.record_id for e in envelopes]
    records = db.query(HealthRecord).filter(HealthRecord.id.in_(record_ids)).all()

    return [{"id": r.id, "record_type": r.record_type, "title": r.title,
             "created_at": str(r.created_at), "owner_id": r.owner_id} for r in records]


@router.get("/{record_id}")
def get_record(record_id: str, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    envelope = db.query(KeyEnvelope).filter(
        KeyEnvelope.record_id == record_id,
        KeyEnvelope.user_id == current_user.id
    ).first()

    if not envelope:
        raise HTTPException(status_code=403, detail="Access denied — no key envelope for this record")

    log_event(db, "record_viewed", user_id=current_user.id, record_id=record.id, ip_address=request.client.host)

    return {
        "id": record.id,
        "record_type": record.record_type,
        "title": record.title,
        "encrypted_data": record.encrypted_data,
        "iv": record.iv,
        "wrapped_aes_key": envelope.wrapped_aes_key,
        "created_at": str(record.created_at),
        "owner_id": record.owner_id,
    }