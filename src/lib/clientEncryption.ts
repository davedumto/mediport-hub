/**
 * Client-side encryption utilities for handling PII data
 * This ensures PII is never transmitted in plain text over the network
 */

export interface EncryptedField {
  encryptedData: string;
  iv: string;
  tag: string;
}

/**
 * Decrypt data on the client side using Web Crypto API
 * This keeps decrypted PII in browser memory only
 */
export class ClientEncryption {
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Decrypt a field using browser's Web Crypto API
   */
  static async decryptField(
    encryptedData: string,
    iv: string,
    tag: string,
    key: string
  ): Promise<string> {
    try {
      // Create key from encryption key
      const salt = new TextEncoder().encode('mediport-salt'); // Use consistent salt
      const cryptoKey = await this.deriveKey(key, salt);

      // Convert hex strings to arrays
      const ciphertext = new Uint8Array(
        encryptedData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );
      const ivArray = new Uint8Array(
        iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );
      const tagArray = new Uint8Array(
        tag.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );

      // Combine ciphertext and tag for AES-GCM
      const combined = new Uint8Array(ciphertext.length + tagArray.length);
      combined.set(ciphertext);
      combined.set(tagArray, ciphertext.length);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivArray,
        },
        cryptoKey,
        combined
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Client-side decryption failed:', error);
      return '[Decryption Failed]';
    }
  }

  /**
   * Parse encrypted field from various formats
   */
  static parseEncryptedField(encryptedField: any): EncryptedField | null {
    try {
      if (typeof encryptedField === 'string') {
        return JSON.parse(encryptedField);
      } else if (encryptedField && typeof encryptedField === 'object') {
        return encryptedField;
      }
      return null;
    } catch {
      return null;
    }
  }
}