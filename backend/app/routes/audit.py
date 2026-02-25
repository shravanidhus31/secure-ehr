from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.models import User, AuditLog, HealthRecord

router = APIRouter(prefix="/audit", tags=["audit"])


def format_log(log, db):
    user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
    record = db.query(HealthRecord).filter(HealthRecord.id == log.record_id).first() if log.record_id else None
    return {
        "id": log.id,
        "action": log.action,
        "user_id": log.user_id,
        "user_name": user.name if user else None,
        "record_id": log.record_id,
        "record_title": record.title if record else None,
        "details": json.loads(log.details) if log.details else None,
        "ip_address": log.ip_address,
        "timestamp": str(log.timestamp),
    }


@router.get("/record/{record_id}")
def get_record_audit(record_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    logs = db.query(AuditLog).filter(AuditLog.record_id == record_id).order_by(AuditLog.timestamp.desc()).all()
    return [format_log(l, db) for l in logs]


@router.get("/me")
def my_audit(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(AuditLog).filter(AuditLog.user_id == current_user.id).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [format_log(l, db) for l in logs]


@router.get("/admin/all")
def all_audit(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(500).all()
    return [format_log(l, db) for l in logs]