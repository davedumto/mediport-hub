import crypto from "crypto";

export class EncryptionService {
  private static algorithm = "aes-256-gcm";
  private static keyLength = 32; // 256 bits
  private static ivLength = 16; // 128 bits
  private static tagLength = 16; // 128 bits

  /**
   * Generate a secure encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString("hex");
  }

  /**
   * Generate a secure initialization vector
   */
  static generateIV(): string {
    return crypto.randomBytes(this.ivLength).toString("hex");
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(
    data: string,
    key: string
  ): { encryptedData: string; iv: string; tag: string } {
    try {
      // Convert hex key to buffer
      const keyBuffer = Buffer.from(key, "hex");

      // Generate IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher with IV
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);
      cipher.setAAD(Buffer.from("mediport-pii", "utf8")); // Additional authenticated data

      // Encrypt data
      let encrypted = cipher.update(data, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Get authentication tag
      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
      };
    } catch (error) {
      throw new Error(
        `Encryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(
    encryptedData: string,
    key: string,
    iv: string,
    tag: string
  ): string {
    try {
      // Convert hex values to buffers
      const keyBuffer = Buffer.from(key, "hex");
      const ivBuffer = Buffer.from(iv, "hex");
      const tagBuffer = Buffer.from(tag, "hex");

      // Create decipher with IV
      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, ivBuffer);
      decipher.setAAD(Buffer.from("mediport-pii", "utf8"));
      decipher.setAuthTag(tagBuffer);

      // Decrypt data
      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Hash sensitive data (one-way, cannot be reversed)
   */
  static hash(data: string, salt?: string): { hash: string; salt: string } {
    const generatedSalt = salt || crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(data, generatedSalt, 10000, 64, "sha512")
      .toString("hex");

    return { hash, salt: generatedSalt };
  }

  /**
   * Verify hashed data
   */
  static verifyHash(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hash(data, salt);
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(computedHash, "hex")
    );
  }

  /**
   * Generate a secure random string
   */
  static generateSecureString(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Mask PII data for display/logging
   */
  static maskPII(
    data: string,
    type: "email" | "name" | "phone" | "license"
  ): string {
    switch (type) {
      case "email":
        return data.replace(/(.{2}).*@(.+)/, "$1***@$2");
      case "name":
        return (
          data.charAt(0) +
          "*".repeat(Math.max(0, data.length - 2)) +
          data.charAt(data.length - 1)
        );
      case "phone":
        return data.replace(/(\d{3})\d{3}(\d{4})/, "$1-***-$2");
      case "license":
        return (
          data.charAt(0) +
          "*".repeat(Math.max(0, data.length - 2)) +
          data.charAt(data.length - 1)
        );
      default:
        return "*".repeat(data.length);
    }
  }
}
