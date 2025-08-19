/**
 * Server-side decryption service for client-encrypted payloads
 */

import * as crypto from 'crypto';

export interface EncryptedPayload {
  encryptedData: string;
  iv: string;
  salt: string;
}

export interface DecryptedLoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
  timestamp: number;
}

export class ClientEncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly ITERATIONS = 100000;

  /**
   * Derive an encryption key from a password using PBKDF2
   */
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEY_LENGTH, 'sha256');
  }

  /**
   * Reconstruct session key based on request information
   * This should match the client-side key generation
   */
  private static reconstructSessionKey(userAgent?: string, timestamp?: number): string {
    // Use the current date for session key (same as client)
    const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Match the client-side hash approach exactly
    const sessionBase = crypto
      .createHash('sha256')
      .update(userAgent || 'unknown')
      .digest('hex')
      .substring(0, 13); // Match client-side length
    
    return `mediport_${date}_${sessionBase}`;
  }

  /**
   * Decrypt client-encrypted payload
   */
  static decryptPayload(encryptedPayload: EncryptedPayload, userAgent?: string): any {
    try {
      const salt = Buffer.from(encryptedPayload.salt, 'base64');
      const iv = Buffer.from(encryptedPayload.iv, 'base64');
      const encryptedData = Buffer.from(encryptedPayload.encryptedData, 'base64');
      
      // Try multiple potential session keys including fallbacks
      const sessionKeys = [
        this.reconstructSessionKey(userAgent),
        // Fallback to yesterday's key (in case of timezone issues)
        this.reconstructSessionKey(userAgent, Date.now() - 24 * 60 * 60 * 1000),
        // Additional fallback approaches
        `mediport_${new Date().toISOString().split('T')[0]}_fallback`,
        `mediport_${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]}_fallback`,
      ];

      for (const sessionKey of sessionKeys) {
        try {
          console.log(`  Trying session key: ${sessionKey}`);
          
          // Derive the encryption key
          const key = this.deriveKey(sessionKey, salt);
          
          // Extract the auth tag (last 16 bytes) and ciphertext
          const authTag = encryptedData.slice(-16);
          const ciphertext = encryptedData.slice(0, -16);
          
          // Create decipher
          const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
          decipher.setAuthTag(authTag);
          
          // Decrypt the data
          let decrypted = decipher.update(ciphertext, undefined, 'utf8');
          decrypted += decipher.final('utf8');
          
          // Parse JSON
          const data = JSON.parse(decrypted);
          
          // Validate timestamp (prevent replay attacks - within 5 minutes)
          if (data.timestamp && Date.now() - data.timestamp > 5 * 60 * 1000) {
            throw new Error('Request timestamp too old');
          }
          
          console.log(`  ✅ Successfully decrypted with key: ${sessionKey}`);
          return data;
        } catch (keyError) {
          console.log(`  ❌ Failed with key ${sessionKey}: ${keyError.message}`);
          // Try next key
          continue;
        }
      }
      
      throw new Error('Failed to decrypt with any session key');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt payload');
    }
  }

  /**
   * Decrypt login credentials specifically
   */
  static decryptLoginCredentials(encryptedPayload: EncryptedPayload, userAgent?: string): DecryptedLoginCredentials {
    const decrypted = this.decryptPayload(encryptedPayload, userAgent);
    
    // Validate required fields
    if (!decrypted.email || !decrypted.password) {
      throw new Error('Invalid login credentials format');
    }
    
    return {
      email: decrypted.email,
      password: decrypted.password,
      mfaCode: decrypted.mfaCode,
      rememberMe: decrypted.rememberMe || false,
      timestamp: decrypted.timestamp
    };
  }

  /**
   * Check if a request contains encrypted payload
   */
  static isEncryptedPayload(body: any): body is { encryptedPayload: EncryptedPayload } {
    return body && 
           body.encryptedPayload && 
           typeof body.encryptedPayload.encryptedData === 'string' &&
           typeof body.encryptedPayload.iv === 'string' &&
           typeof body.encryptedPayload.salt === 'string';
  }

  /**
   * Server-side encryption for responses (to prevent plain text PII transmission)
   */
  static encryptPayload(data: any, userAgent?: string): EncryptedPayload {
    try {
      // Generate random salt and IV (using hardcoded values since constants may not be available)
      const salt = crypto.randomBytes(16); // SALT_LENGTH
      const iv = crypto.randomBytes(12);   // IV_LENGTH
      
      // Get session-based key (matching client approach)
      const sessionKey = this.reconstructSessionKey(userAgent);
      
      // Derive encryption key
      const key = this.deriveKey(sessionKey, salt);
      
      // Convert data to string
      const dataString = JSON.stringify(data);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(dataString, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get auth tag
      const authTag = cipher.getAuthTag();
      
      // Combine ciphertext and auth tag
      const combined = Buffer.concat([encrypted, authTag]);
      
      return {
        encryptedData: combined.toString('base64'),
        iv: iv.toString('base64'),
        salt: salt.toString('base64')
      };
    } catch (error) {
      console.error('Server-side encryption failed:', error);
      throw new Error('Failed to encrypt response data');
    }
  }
}