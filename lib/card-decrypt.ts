/**
 * Card Data Decryption for Rain Cards API
 * 
 * This module provides utilities to decrypt encrypted card data (PAN and CVC)
 * received from the Rain API using AES-128-GCM decryption.
 */

import crypto from 'crypto';

const USE_TEST_CARDS = process.env.USE_TEST_CARDS === 'true' || process.env.USE_TEST_CARDS === '1';

/**
 * Decrypt encrypted card secret (PAN or CVC)
 * 
 * In test mode (USE_TEST_CARDS=true), the data is just base64 encoded plaintext,
 * so we decode it directly without decryption.
 * 
 * @param base64Secret - Base64 encoded encrypted secret (or plaintext in test mode)
 * @param base64Iv - Base64 encoded initialization vector (ignored in test mode)
 * @param secretKey - 32-character hexadecimal string used for decryption (ignored in test mode)
 * @returns Decrypted string (card number or CVC)
 */
export function decryptSecret(
  base64Secret: string,
  base64Iv: string,
  secretKey: string
): string {
  if (!base64Secret) throw new Error("base64Secret is required");
  
  // In test mode, the data is just base64 encoded plaintext
  if (USE_TEST_CARDS) {
    try {
      return Buffer.from(base64Secret, "base64").toString("utf8");
    } catch (error) {
      // If base64 decode fails, try as-is (might already be plaintext)
      return base64Secret;
    }
  }
  
  // Normal decryption flow for production
  if (!base64Iv) throw new Error("base64Iv is required");
  if (!secretKey || !/^[0-9A-Fa-f]+$/.test(secretKey)) {
    throw new Error("secretKey must be a hex string");
  }

  const secret = Buffer.from(base64Secret, "base64");
  const iv = Buffer.from(base64Iv, "base64");
  const secretKeyBuffer = Buffer.from(secretKey, "hex");

  // AES-GCM typically uses a 128-bit (16-byte) authentication tag
  const tagLength = 16;

  // Separate the ciphertext from the authentication tag
  const ciphertext = secret.subarray(0, -tagLength);
  const authTag = secret.subarray(-tagLength);

  const cryptoKey = crypto.createDecipheriv("aes-128-gcm", secretKeyBuffer, iv);
  cryptoKey.setAutoPadding(false);
  cryptoKey.setAuthTag(authTag);

  let decrypted = cryptoKey.update(ciphertext, undefined, "utf8");
  decrypted += cryptoKey.final("utf8");

  return decrypted.trim();
}

