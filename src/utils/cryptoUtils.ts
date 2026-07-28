const SAVE_SECRET_KEY = 'TS3D_SECRET_INTEGRITY_SALT_#2026_@AGRO';

/**
 * Computes a fast synchronous checksum string over an object for local storage guardrails.
 */
export function computeSyncChecksum(payload: Record<string, any>): string {
  if (!payload || typeof payload !== 'object') return '';
  const { signature, checksum, ...cleanPayload } = payload;
  const str = JSON.stringify(cleanPayload) + SAVE_SECRET_KEY;
  let h1 = 0x811c9dc5;
  let h2 = 0x097182a3;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ ch, 0x050c5d17);
  }
  return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
}

/**
 * Verifies synchronous checksum of a save or local state object.
 */
export function verifySyncChecksum(payload: Record<string, any>): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const provided = payload.signature || payload.checksum;
  if (!provided || typeof provided !== 'string') return false;
  const expected = computeSyncChecksum(payload);
  return provided === expected;
}

/**
 * Computes an HMAC-SHA256 signature over the clean save object.
 */
export async function computeSaveChecksum(payload: Record<string, any>): Promise<string> {
  // Omit existing signature or checksum fields to calculate canonical hash
  const { signature, checksum, ...cleanPayload } = payload;
  
  const jsonString = JSON.stringify(cleanPayload);
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SAVE_SECRET_KEY);
  const messageData = encoder.encode(jsonString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies the save object integrity against its HMAC-SHA256 signature.
 */
export async function verifySaveChecksum(payload: Record<string, any>): Promise<{ valid: boolean; isUnsigned?: boolean }> {
  if (!payload || typeof payload !== 'object') {
    return { valid: false };
  }

  const providedSignature = payload.signature || payload.checksum;
  if (!providedSignature) {
    return { valid: false, isUnsigned: true };
  }

  try {
    const expectedSignature = await computeSaveChecksum(payload);
    return { valid: expectedSignature === providedSignature };
  } catch (err) {
    console.error('Erro ao verificar assinatura HMAC:', err);
    return { valid: false };
  }
}
