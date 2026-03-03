from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy import func
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.patient)
    is_active = Column(String(5), default="true")

    # Crypto fields
    public_key = Column(Text, nullable=False)            # RSA public key — stored openly
    encrypted_private_key = Column(Text, nullable=False) # RSA private key — AES encrypted
    salt = Column(String(64), nullable=False)             # PBKDF2 salt

    created_at = Column(DateTime, server_default=func.now())

    owned_records = relationship("HealthRecord", back_populates="owner", foreign_keys="HealthRecord.owner_id")
    key_envelopes = relationship("KeyEnvelope", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class HealthRecord(Base):
    __tablename__ = "records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)

    # Server only ever stores these — never plaintext
    encrypted_data = Column(Text, nullable=False)  # AES-GCM ciphertext (base64)
    iv = Column(String(32), nullable=False)         # AES nonce (base64)

    # Safe unencrypted metadata for listings
    record_type = Column(String(50), nullable=False)  # diagnosis, prescription, lab_result
    title = Column(String(200), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="owned_records", foreign_keys=[owner_id])
    key_envelopes = relationship("KeyEnvelope", back_populates="record", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="record")
    
    encrypted_pdf = Column(Text, nullable=True)
    pdf_iv = Column(String, nullable=True)
    pdf_filename = Column(String, nullable=True)


class KeyEnvelope(Base):
    """
    One row per (record, user) pair.
    This table IS the access control system.
    No envelope = cannot decrypt. Simple as that.
    """
    __tablename__ = "key_envelopes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id = Column(String, ForeignKey("records.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    wrapped_aes_key = Column(Text, nullable=False)  # RSA-encrypted AES key (base64)
    created_at = Column(DateTime, server_default=func.now())

    record = relationship("HealthRecord", back_populates="key_envelopes")
    user = relationship("User", back_populates="key_envelopes")
    
    wrapped_pdf_key = Column(Text, nullable=True)


class AuditLog(Base):
    """Append-only. Never update or delete rows here."""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    record_id = Column(String, ForeignKey("records.id"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="audit_logs")
    record = relationship("HealthRecord", back_populates="audit_logs")