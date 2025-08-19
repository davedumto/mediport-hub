/**
 * Client-side encryption utility for sensitive data transmission
 * Uses AES-GCM encryption with a public key derivation approach
 */

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Convert ArrayBuffer to string
function arrayBufferToString(buf: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buf);
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface EncryptedPayload {
  encryptedData: string;
  iv: string;
  salt: string;
}

export class ClientSideEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 16;

  /**
   * Derive an encryption key from a password using PBKDF2
   */
  private static async deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const passwordBuffer = stringToArrayBuffer(password);
    
    // Import the password as a key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive the actual encryption key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a session-based encryption key
   * This creates a deterministic key based on timestamp and browser session
   */
  private static async getSessionKey(): Promise<string> {
    // Create a session-based key that changes daily but is deterministic
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Use a deterministic approach based on user agent for server compatibility
    const userAgent = navigator.userAgent || 'unknown';
    const sessionBase = await this.hashString(userAgent);
    
    return `mediport_${date}_${sessionBase}`;
  }

  /**
   * Hash function using Web Crypto API to match server-side SHA-256
   */
  private static async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 13); // Match server-side length
  }

  /**
   * Encrypt sensitive data for transmission
   */
  static async encryptPayload(data: any): Promise<EncryptedPayload> {
    try {
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Get session-based key
      const sessionKey = await this.getSessionKey();
      
      // Derive encryption key
      const key = await this.deriveKey(sessionKey, salt);
      
      // Convert data to string and then to ArrayBuffer
      const dataString = JSON.stringify(data);
      const dataBuffer = stringToArrayBuffer(dataString);
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        dataBuffer
      );
      
      return {
        encryptedData: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv),
        salt: arrayBufferToBase64(salt)
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Encrypt login credentials specifically
   */
  static async encryptLoginCredentials(email: string, password: string, mfaCode?: string, rememberMe?: boolean): Promise<EncryptedPayload> {
    const credentials = {
      email,
      password,
      mfaCode,
      rememberMe,
      timestamp: Date.now() // Add timestamp for replay attack prevention
    };
    
    return this.encryptPayload(credentials);
  }

  /**
   * Server-side decryption method (to be implemented on the server)
   * This is just for reference - the actual implementation should be on the server
   */
  static async decryptPayload(encryptedPayload: EncryptedPayload, sessionKey?: string): Promise<any> {
    try {
      const salt = base64ToArrayBuffer(encryptedPayload.salt);
      const iv = base64ToArrayBuffer(encryptedPayload.iv);
      const encryptedData = base64ToArrayBuffer(encryptedPayload.encryptedData);
      
      // Use provided session key or generate current one
      const actualSessionKey = sessionKey || await this.getSessionKey();
      
      // Derive the same key
      const key = await this.deriveKey(actualSessionKey, salt);
      
      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encryptedData
      );
      
      // Convert back to string and parse JSON
      const dataString = arrayBufferToString(decrypted);
      return JSON.parse(dataString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}