from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import User, UserRole

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/doctors")
def search_doctors(
    q: str = Query(default="", description="Search by name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns doctor public keys — safe to share openly.
    Client uses the public key to re-wrap the AES key when granting access.
    """
    doctors = db.query(User).filter(
        User.role == UserRole.doctor,
        User.is_active == "true",
        User.name.ilike(f"%{q}%")
    ).limit(20).all()

    return [{"id": d.id, "name": d.name, "role": d.role, "public_key": d.public_key} for d in doctors]