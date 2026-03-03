/**
 * crypto.js — Browser-side cryptography using the Web Crypto API
 * Mirrors the Python crypto_service.py but runs entirely in the browser.
 * The server never sees plaintext records or decrypted private keys.
 */

// ── Helpers ──────────────────────────────────────────────────

export function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

export function base64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function pemToBytes(pem) {
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  return base64ToBytes(base64);
}

// ── PBKDF2 Key Derivation ────────────────────────────────────

/**
 * Derive a 256-bit AES key from the user's password.
 * Used to decrypt the private key blob received from the server on login.
 * 600,000 iterations — matches NIST recommendation and our Python implementation.
 */
export async function deriveKeyFromPassword(password, saltBytes) {
  const encodedPassword = new TextEncoder().encode(password);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encodedPassword,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 600000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Private Key Management ───────────────────────────────────

/**
 * Decrypt the RSA private key blob received from server on login.
 * Returns the private key as a CryptoKey object for use in unwrapping.
 */
export async function decryptPrivateKey(encryptedPrivateKey, salt, iv, password) {
  const saltBytes = base64ToBytes(salt);
  const ivBytes = base64ToBytes(iv);
  const ciphertext = base64ToBytes(encryptedPrivateKey);

  const derivedKey = await deriveKeyFromPassword(password, saltBytes);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    derivedKey,
    ciphertext
  );

  // decrypted is the raw PEM bytes of the RSA private key
  const pemString = new TextDecoder().decode(decrypted);

  // Import as CryptoKey for use in unwrapKey
  return window.crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(pemString),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt', 'unwrapKey']
  );
}

// ── Record Encryption ────────────────────────────────────────

/**
 * Encrypt a health record in the browser before sending to server.
 * recipient_public_key_pem: the patient's public key (PEM string from DB)
 * Returns: { encrypted_data, iv, wrapped_aes_key } — all base64 encoded
 */
export async function encryptRecord(plaintext, recipientPublicKeyPem) {
  // Import recipient's RSA public key
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    pemToBytes(recipientPublicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['wrapKey']
  );

  // Generate fresh AES-256 session key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Generate random 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the record data
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    new TextEncoder().encode(JSON.stringify(plaintext))
  );

  // Wrap (encrypt) the AES key with recipient's RSA public key
  const wrappedKey = await window.crypto.subtle.wrapKey(
    'raw',
    aesKey,
    publicKey,
    { name: 'RSA-OAEP', hash: 'SHA-256' }
  );

  return {
    encrypted_data: bytesToBase64(encrypted),
    iv: bytesToBase64(iv),
    wrapped_aes_key: bytesToBase64(wrappedKey),
  };
}

// ── Record Decryption ────────────────────────────────────────

/**
 * Decrypt a health record using the user's private key.
 * privateKey: CryptoKey object (from decryptPrivateKey above)
 * All inputs are base64 strings as returned by the server.
 */
export async function decryptRecord(encryptedData, iv, wrappedAesKey, privateKey) {
  // Unwrap the AES key using RSA private key
  const aesKey = await window.crypto.subtle.unwrapKey(
    'raw',
    base64ToBytes(wrappedAesKey),
    privateKey,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt the record
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv), tagLength: 128 },
    aesKey,
    base64ToBytes(encryptedData)
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}

// ── Access Delegation ────────────────────────────────────────

/**
 * Re-wrap an AES key for a new user (grant access).
 * 1. Unwrap the AES key using owner's private key
 * 2. Re-wrap it using the doctor's RSA public key
 * Returns: new wrapped_aes_key (base64) to POST to server
 */
export async function rewrapKeyForUser(wrappedAesKey, ownerPrivateKey, doctorPublicKeyPem) {
  // Import doctor's public key
  const doctorPublicKey = await window.crypto.subtle.importKey(
    'spki',
    pemToBytes(doctorPublicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['wrapKey']
  );

  // Unwrap AES key with owner's private key
  const aesKey = await window.crypto.subtle.unwrapKey(
    'raw',
    base64ToBytes(wrappedAesKey),
    ownerPrivateKey,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  

  // Re-wrap with doctor's public key
  const newWrappedKey = await window.crypto.subtle.wrapKey(
    'raw',
    aesKey,
    doctorPublicKey,
    { name: 'RSA-OAEP', hash: 'SHA-256' }
  );

  
  return bytesToBase64(newWrappedKey);

  
}
export async function encryptPdf(file, recipientPublicKeyPem) {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);

  // Generate AES session key — must be extractable to wrap it
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,  // extractable — needed for wrapKey
    ['encrypt', 'decrypt']
  );

  // Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the PDF bytes with AES-GCM
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    fileBytes
  );

  // Import recipient RSA public key
  const pubKeyBytes = pemToBytes(recipientPublicKeyPem);
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    pubKeyBytes,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['wrapKey']
  );

  // Wrap AES key with RSA public key
  const wrappedAesKey = await window.crypto.subtle.wrapKey(
    'raw',
    aesKey,
    publicKey,
    { name: 'RSA-OAEP' }
  );

  return {
    encrypted_pdf: bytesToBase64(new Uint8Array(encrypted)),
    pdf_iv: bytesToBase64(iv),
    wrapped_pdf_key: bytesToBase64(new Uint8Array(wrappedAesKey)),
    filename: file.name,
  };
}