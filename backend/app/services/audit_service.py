import json
from sqlalchemy.orm import Session
from app.models.models import AuditLog


def log_event(
    db: Session,
    action: str,
    user_id: str = None,
    record_id: str = None,
    details: dict = None,
    ip_address: str = None,
):
    """
    Write an audit log entry. Always append — never update or delete.

    action examples:
      user_registered, user_login, user_login_failed,
      record_created, record_viewed,
      access_granted, access_revoked
    """
    entry = AuditLog(
        user_id=user_id,
        record_id=record_id,
        action=action,
        details=json.dumps(details) if details else None,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()