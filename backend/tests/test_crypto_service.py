"""
test_crypto_service.py — Unit tests for all cryptographic functions.

Run with: pytest tests/ -v
These tests use known vectors where possible and cover all the main flows.
"""

import pytest
import json
import base64

from app.services.crypto_service import (
    generate_keypair,
    serialize_public_key,
    deserialize_public_key,
    serialize_private_key,
    deserialize_private_key,
    encrypt_private_key,
    decrypt_private_key,
    encrypt_record,
    decrypt_record,
    rewrap_key_for_user,
)


# ─────────────────────────────────────────────────────────────
#  KEYPAIR GENERATION
# ─────────────────────────────────────────────────────────────

class TestKeypairGeneration:

    def test_generates_valid_keypair(self):
        private_key, public_key = generate_keypair()
        assert private_key is not None
        assert public_key is not None

    def test_public_key_serializes_to_pem(self):
        _, public_key = generate_keypair()
        pem = serialize_public_key(public_key)
        assert pem.startswith("-----BEGIN PUBLIC KEY-----")
        assert "-----END PUBLIC KEY-----" in pem

    def test_public_key_roundtrip(self):
        """Serialize then deserialize a public key — should recover the same key."""
        _, public_key = generate_keypair()
        pem = serialize_public_key(public_key)
        recovered = deserialize_public_key(pem)
        # Compare by re-serializing
        assert serialize_public_key(recovered) == pem

    def test_private_key_roundtrip(self):
        """Serialize then deserialize a private key — should recover the same key."""
        private_key, _ = generate_keypair()
        pem_bytes = serialize_private_key(private_key)
        recovered = deserialize_private_key(pem_bytes)
        assert serialize_private_key(recovered) == pem_bytes

    def test_each_keypair_is_unique(self):
        """Two calls should produce different keys."""
        _, pub1 = generate_keypair()
        _, pub2 = generate_keypair()
        assert serialize_public_key(pub1) != serialize_public_key(pub2)


# ─────────────────────────────────────────────────────────────
#  PRIVATE KEY PROTECTION (PBKDF2)
# ─────────────────────────────────────────────────────────────

class TestPrivateKeyProtection:

    def test_encrypt_and_decrypt_private_key(self):
        """Full round-trip: encrypt private key with password, then recover it."""
        private_key, _ = generate_keypair()
        password = "SecurePassword123!"

        protected = encrypt_private_key(private_key, password)

        # Verify all required fields are returned
        assert "encrypted_private_key" in protected
        assert "salt" in protected
        assert "iv" in protected

        # Recover the private key
        recovered = decrypt_private_key(
            protected["encrypted_private_key"],
            protected["salt"],
            protected["iv"],
            password
        )

        # Confirm it's the same key
        assert serialize_private_key(recovered) == serialize_private_key(private_key)

    def test_wrong_password_fails(self):
        """Decrypting with the wrong password should raise an error."""
        from cryptography.exceptions import InvalidTag

        private_key, _ = generate_keypair()
        protected = encrypt_private_key(private_key, "CorrectPassword")

        with pytest.raises((InvalidTag, Exception)):
            decrypt_private_key(
                protected["encrypted_private_key"],
                protected["salt"],
                protected["iv"],
                "WrongPassword"
            )

    def test_different_salts_produce_different_ciphertexts(self):
        """Same password + same key but different salts → different ciphertexts."""
        private_key, _ = generate_keypair()
        password = "SamePassword"
        result1 = encrypt_private_key(private_key, password)
        result2 = encrypt_private_key(private_key, password)
        # Salts should differ (random), so ciphertexts differ
        assert result1["salt"] != result2["salt"]
        assert result1["encrypted_private_key"] != result2["encrypted_private_key"]


# ─────────────────────────────────────────────────────────────
#  RECORD ENCRYPTION / DECRYPTION
# ─────────────────────────────────────────────────────────────

class TestRecordEncryption:

    @pytest.fixture
    def keypair(self):
        return generate_keypair()

    def test_encrypt_and_decrypt_dict(self, keypair):
        """Encrypt a dict record and recover it."""
        private_key, public_key = keypair
        plaintext = {
            "diagnosis": "Type 2 Diabetes",
            "notes": "Patient presents with elevated glucose levels.",
            "medications": ["Metformin 500mg", "Insulin"]
        }

        result = encrypt_record(plaintext, public_key)
        assert "encrypted_data" in result
        assert "iv" in result
        assert "wrapped_aes_key" in result

        # Ciphertext should not contain plaintext
        assert "Diabetes" not in result["encrypted_data"]

        recovered = decrypt_record(
            result["encrypted_data"],
            result["iv"],
            result["wrapped_aes_key"],
            private_key
        )
        assert recovered == plaintext

    def test_encrypt_and_decrypt_string(self, keypair):
        """Encrypt a plain string record."""
        private_key, public_key = keypair
        plaintext = "Patient follow-up in 3 months. No immediate concerns."

        result = encrypt_record(plaintext, public_key)
        recovered = decrypt_record(
            result["encrypted_data"],
            result["iv"],
            result["wrapped_aes_key"],
            private_key
        )
        assert recovered == plaintext

    def test_ciphertext_is_not_plaintext(self, keypair):
        """Encrypted data should be unreadable."""
        _, public_key = keypair
        sensitive = {"ssn": "123-45-6789", "diagnosis": "HIV Positive"}
        result = encrypt_record(sensitive, public_key)

        # Base64 decode and check it's not JSON-readable
        raw = base64.b64decode(result["encrypted_data"])
        assert b"HIV" not in raw
        assert b"123-45-6789" not in raw

    def test_wrong_private_key_cannot_decrypt(self, keypair):
        """A different private key should not be able to decrypt."""
        from cryptography.exceptions import InvalidTag

        _, public_key = keypair
        wrong_private_key, _ = generate_keypair()  # Different keypair

        plaintext = {"secret": "confidential data"}
        result = encrypt_record(plaintext, public_key)

        with pytest.raises((InvalidTag, ValueError, Exception)):
            decrypt_record(
                result["encrypted_data"],
                result["iv"],
                result["wrapped_aes_key"],
                wrong_private_key
            )

    def test_tampered_ciphertext_fails(self, keypair):
        """AES-GCM authentication tag should reject tampered ciphertext."""
        from cryptography.exceptions import InvalidTag

        private_key, public_key = keypair
        result = encrypt_record({"data": "sensitive"}, public_key)

        # Tamper with the ciphertext
        raw = base64.b64decode(result["encrypted_data"])
        tampered = bytearray(raw)
        tampered[5] ^= 0xFF  # Flip bits
        result["encrypted_data"] = base64.b64encode(bytes(tampered)).decode()

        with pytest.raises((InvalidTag, Exception)):
            decrypt_record(
                result["encrypted_data"],
                result["iv"],
                result["wrapped_aes_key"],
                private_key
            )

    def test_each_encryption_uses_fresh_aes_key(self, keypair):
        """Same plaintext encrypted twice should produce different ciphertexts."""
        _, public_key = keypair
        plaintext = {"data": "same content"}

        result1 = encrypt_record(plaintext, public_key)
        result2 = encrypt_record(plaintext, public_key)

        # Both IVs and ciphertexts should differ
        assert result1["iv"] != result2["iv"]
        assert result1["encrypted_data"] != result2["encrypted_data"]
        assert result1["wrapped_aes_key"] != result2["wrapped_aes_key"]


# ─────────────────────────────────────────────────────────────
#  ACCESS DELEGATION (KEY RE-WRAPPING)
# ─────────────────────────────────────────────────────────────

class TestAccessDelegation:

    def test_grant_and_use_access(self):
        """
        Full access delegation flow:
        1. Patient encrypts a record
        2. Patient grants doctor access (re-wraps AES key)
        3. Doctor decrypts the record using their own key envelope
        """
        # Generate patient and doctor keypairs
        patient_private, patient_public = generate_keypair()
        doctor_private, doctor_public = generate_keypair()

        # Patient creates a record
        plaintext = {"diagnosis": "Hypertension", "bp": "140/90"}
        result = encrypt_record(plaintext, patient_public)

        # Patient grants doctor access by re-wrapping the AES key
        doctor_envelope = rewrap_key_for_user(
            result["wrapped_aes_key"],
            patient_private,
            doctor_public
        )

        # Doctor decrypts using their own envelope
        recovered = decrypt_record(
            result["encrypted_data"],
            result["iv"],
            doctor_envelope,
            doctor_private
        )

        assert recovered == plaintext

    def test_revoked_user_cannot_decrypt(self):
        """
        After revocation (envelope deleted), the user cannot decrypt.
        We simulate this by simply not using the revoked envelope.
        The point: without the envelope, decryption fails — not just a 403.
        """
        from cryptography.exceptions import InvalidTag

        patient_private, patient_public = generate_keypair()
        doctor_private, doctor_public = generate_keypair()

        plaintext = {"note": "Confidential note"}
        result = encrypt_record(plaintext, patient_public)

        # Grant access
        doctor_envelope = rewrap_key_for_user(
            result["wrapped_aes_key"],
            patient_private,
            doctor_public
        )

        # Simulate revocation: doctor tries to decrypt with a wrong/missing key
        wrong_private, _ = generate_keypair()

        with pytest.raises((InvalidTag, ValueError, Exception)):
            decrypt_record(
                result["encrypted_data"],
                result["iv"],
                doctor_envelope,  # Envelope exists but wrong private key
                wrong_private
            )

    def test_third_party_cannot_decrypt(self):
        """An unauthorized user with no envelope cannot decrypt the record."""
        from cryptography.exceptions import InvalidTag

        _, patient_public = generate_keypair()
        attacker_private, _ = generate_keypair()

        result = encrypt_record({"secret": "data"}, patient_public)

        # Attacker tries to use the patient's envelope with their own private key
        with pytest.raises((InvalidTag, ValueError, Exception)):
            decrypt_record(
                result["encrypted_data"],
                result["iv"],
                result["wrapped_aes_key"],  # Patient's envelope
                attacker_private             # Attacker's private key → fails
            )

    def test_multiple_users_can_decrypt_same_record(self):
        """Multiple envelopes, one ciphertext — each authorized user can read."""
        patient_private, patient_public = generate_keypair()
        doctor1_private, doctor1_public = generate_keypair()
        doctor2_private, doctor2_public = generate_keypair()

        plaintext = {"result": "All clear", "test": "MRI"}
        result = encrypt_record(plaintext, patient_public)

        envelope_doc1 = rewrap_key_for_user(result["wrapped_aes_key"], patient_private, doctor1_public)
        envelope_doc2 = rewrap_key_for_user(result["wrapped_aes_key"], patient_private, doctor2_public)

        # All three can read the same encrypted record
        assert decrypt_record(result["encrypted_data"], result["iv"], result["wrapped_aes_key"], patient_private) == plaintext
        assert decrypt_record(result["encrypted_data"], result["iv"], envelope_doc1, doctor1_private) == plaintext
        assert decrypt_record(result["encrypted_data"], result["iv"], envelope_doc2, doctor2_private) == plaintext
