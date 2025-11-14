/**
 * SessionId Generation for Rain Cards API
 * 
 * The SessionId is an encrypted session ID generated using RSA public key encryption.
 * This module provides utilities to generate encrypted SessionIds.
 */

import crypto from 'crypto';

/**
 * Development SessionId Public Key
 */
const DEV_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCAP192809jZyaw62g/eTzJ3P9H
+RmT88sXUYjQ0K8Bx+rJ83f22+9isKx+lo5UuV8tvOlKwvdDS/pVbzpG7D7NO45c
0zkLOXwDHZkou8fuj8xhDO5Tq3GzcrabNLRLVz3dkx0znfzGOhnY4lkOMIdKxlQb
LuVM/dGDC9UpulF+UwIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Production SessionId Public Key
 */
const PROD_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCeZ9uCoxi2XvOw1VmvVLo88TLk
GE+OO1j3fa8HhYlJZZ7CCIAsaCorrU+ZpD5PUTnmME3DJk+JyY1BB3p8XI+C5uno
QucrbxFbkM1lgR10ewz/LcuhleG0mrXL/bzUZbeJqI6v3c9bXvLPKlsordPanYBG
FZkmBPxc8QEdRgH4awIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Generate an encrypted SessionId according to Rain's specification
 * 
 * Requirements:
 * - The secret must be a 32-character hexadecimal string with no spaces or dashes
 * - Encryption must use RSA-OAEP padding with the provided public key
 * 
 * @param pem - The RSA public key in PEM format
 * @param secret - Optional 32-character hex string. If not provided, a UUID will be used
 * @returns Object with secretKey (hex string) and sessionId (base64 encrypted string)
 */
export function generateSessionId(pem?: string, secret?: string): {
  secretKey: string;
  sessionId: string;
} {
  const publicKey = pem || DEV_PUBLIC_KEY;

  if (secret && !/^[0-9A-Fa-f]+$/.test(secret)) {
    throw new Error("secret must be a hex string");
  }

  // Generate or use provided secret (32-char hex string)
  const secretKey = secret ?? crypto.randomUUID().replace(/-/g, "");
  
  // Convert secret to base64
  const secretKeyBase64 = Buffer.from(secretKey, "hex").toString("base64");
  const secretKeyBase64Buffer = Buffer.from(secretKeyBase64, "utf-8");
  
  // Encrypt the base64 string using RSA-OAEP
  const secretKeyBase64BufferEncrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    secretKeyBase64Buffer,
  );

  return {
    secretKey,
    sessionId: secretKeyBase64BufferEncrypted.toString("base64"),
  };
}

/**
 * Helper function to generate SessionId with environment-based public key
 * 
 * @param useProduction - Whether to use production or development public key (default: false for dev)
 * @param secret - Optional 32-character hex string. If not provided, a UUID will be used
 * @returns Object with secretKey (hex string) and sessionId (base64 encrypted string)
 */
export function generateSessionIdForEnv(
  useProduction: boolean = false,
  secret?: string
): { secretKey: string; sessionId: string } {
  const publicKey = useProduction ? PROD_PUBLIC_KEY : DEV_PUBLIC_KEY;
  return generateSessionId(publicKey, secret);
}

