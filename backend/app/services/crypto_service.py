"""
Hybrid encryption model:
  AES-256-GCM  → encrypts the health record data
  RSA-2048-OAEP → encrypts the AES session key
  PBKDF2        → derives a key from user password to protect their RSA private key
"""

import os
import base64
import json

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey, RSAPublicKey
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


# ── RSA KEYPAIR ──────────────────────────────────────────────

def generate_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return private_key, private_key.public_key()


def serialize_public_key(public_key) -> str:
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode("utf-8")


def deserialize_public_key(pem_str: str):
    return serialization.load_pem_public_key(pem_str.encode("utf-8"))


def serialize_private_key(private_key) -> bytes:
    return private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )


def deserialize_private_key(pem_bytes: bytes):
    return serialization.load_pem_private_key(pem_bytes, password=None)


# ── PRIVATE KEY PROTECTION (PBKDF2 + AES-GCM) ───────────────

def derive_key_from_password(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=600_000,
    )
    return kdf.derive(password.encode("utf-8"))


def encrypt_private_key(private_key, password: str) -> dict:
    salt = os.urandom(32)
    iv = os.urandom(12)
    derived_key = derive_key_from_password(password, salt)
    encrypted = AESGCM(derived_key).encrypt(iv, serialize_private_key(private_key), None)
    return {
        "encrypted_private_key": base64.b64encode(encrypted).decode("utf-8"),
        "salt": base64.b64encode(salt).decode("utf-8"),
        "iv": base64.b64encode(iv).decode("utf-8"),
    }


def decrypt_private_key(encrypted_private_key: str, salt: str, iv: str, password: str):
    derived_key = derive_key_from_password(password, base64.b64decode(salt))
    plaintext = AESGCM(derived_key).decrypt(
        base64.b64decode(iv),
        base64.b64decode(encrypted_private_key),
        None
    )
    return deserialize_private_key(plaintext)


# ── RECORD ENCRYPTION (AES-256-GCM) ─────────────────────────

def encrypt_record(plaintext, recipient_public_key) -> dict:
    # Serialize to bytes
    data_bytes = json.dumps(plaintext).encode("utf-8") if isinstance(plaintext, dict) else plaintext.encode("utf-8")

    # Fresh AES key + nonce every time
    aes_key = AESGCM.generate_key(bit_length=256)
    iv = os.urandom(12)

    # Encrypt data
    encrypted_data = AESGCM(aes_key).encrypt(iv, data_bytes, None)

    # Wrap AES key with recipient's RSA public key
    wrapped_aes_key = recipient_public_key.encrypt(
        aes_key,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )

    return {
        "encrypted_data": base64.b64encode(encrypted_data).decode("utf-8"),
        "iv": base64.b64encode(iv).decode("utf-8"),
        "wrapped_aes_key": base64.b64encode(wrapped_aes_key).decode("utf-8"),
    }


def decrypt_record(encrypted_data: str, iv: str, wrapped_aes_key: str, private_key):
    # Unwrap AES key with RSA private key
    aes_key = private_key.decrypt(
        base64.b64decode(wrapped_aes_key),
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )

    # Decrypt data
    plaintext_bytes = AESGCM(aes_key).decrypt(
        base64.b64decode(iv),
        base64.b64decode(encrypted_data),
        None
    )

    try:
        return json.loads(plaintext_bytes.decode("utf-8"))
    except json.JSONDecodeError:
        return plaintext_bytes.decode("utf-8")


# ── ACCESS DELEGATION ────────────────────────────────────────

def rewrap_key_for_user(wrapped_aes_key: str, owner_private_key, new_user_public_key) -> str:
    # Unwrap with owner's private key
    aes_key = owner_private_key.decrypt(
        base64.b64decode(wrapped_aes_key),
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )
    # Re-wrap with new user's public key
    new_wrapped = new_user_public_key.encrypt(
        aes_key,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )
    return base64.b64encode(new_wrapped).decode("utf-8")