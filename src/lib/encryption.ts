import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32-byte key

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

// Modern encryption using createCipheriv
export function encrypt(plaintext: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  cipher.setAAD(Buffer.from("ehr-system", "utf8"));

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

// Modern decryption using createDecipheriv
export function decrypt(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encryptedData.iv, "hex")
  );
  decipher.setAAD(Buffer.from("ehr-system", "utf8"));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));

  let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Encrypt a field and return JSON string for database storage
export async function encryptField(
  plaintext: string | null | undefined
): Promise<string | null> {
  if (!plaintext) return null;

  try {
    const encrypted = encrypt(plaintext);
    return JSON.stringify(encrypted);
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt field");
  }
}

// Decrypt a field from JSON string stored in database
export async function decryptField(
  encryptedJson: string | null | undefined
): Promise<string | null> {
  if (!encryptedJson) return null;

  try {
    const encryptedData: EncryptedData = JSON.parse(encryptedJson);
    return decrypt(encryptedData);
  } catch (error) {
    console.error("Decryption error:", error);
    return null; // Return null instead of throwing to handle corrupted data gracefully
  }
}

// Encrypt multiple fields at once
export async function encryptFields(
  fields: Record<string, string | null | undefined>
): Promise<Record<string, string | null>> {
  const encryptedFields: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(fields)) {
    encryptedFields[key] = await encryptField(value);
  }

  return encryptedFields;
}

// Decrypt multiple fields at once
export async function decryptFields(
  encryptedFields: Record<string, string | null | undefined>
): Promise<Record<string, string | null>> {
  const decryptedFields: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(encryptedFields)) {
    decryptedFields[key] = await decryptField(value);
  }

  return decryptedFields;
}

// Check if a field is encrypted
export function isEncrypted(data: string | null | undefined): boolean {
  if (!data) return false;

  try {
    const parsed = JSON.parse(data);
    return (
      parsed &&
      typeof parsed === "object" &&
      "encrypted" in parsed &&
      "iv" in parsed &&
      "tag" in parsed
    );
  } catch {
    return false;
  }
}
