// Simple AES-GCM encryption/decryption for backup files using WebCrypto
// Allows either one-time passphrase or saved passphrase from settings

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function getKeyFromPassphrase(passphrase, saltBase64) {
  const salt = saltBase64 ? Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey('raw', textEncoder.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return { key, saltBase64: btoa(String.fromCharCode(...salt)) };
}

export async function encryptBackup(jsonString, passphrase) {
  const { key, saltBase64 } = await getKeyFromPassphrase(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = textEncoder.encode(jsonString);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(cipher)));
  return JSON.stringify({ v: 1, salt: saltBase64, iv: ivBase64, data: cipherBase64 });
}

export async function decryptBackup(encJsonString, passphrase) {
  const payload = JSON.parse(encJsonString);
  const { key } = await getKeyFromPassphrase(passphrase, payload.salt);
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const cipher = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return textDecoder.decode(plain);
}
