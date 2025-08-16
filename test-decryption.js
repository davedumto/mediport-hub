// Simple test to verify decryption service
const { DecryptionService } = require("./src/services/decryptionService.ts");

// Mock localStorage for testing
global.localStorage = {
  getItem: (key) => {
    if (key === "auth_tokens") {
      return JSON.stringify({
        accessToken: "test-token-123",
      });
    }
    return null;
  },
  setItem: () => {},
  removeItem: () => {},
};

// Mock fetch for testing
global.fetch = async (url, options) => {
  if (url === "/api/encryption/key") {
    // Check if Authorization header is present
    if (options.headers.Authorization === "Bearer test-token-123") {
      return {
        ok: true,
        json: async () => ({
          success: true,
          key: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        }),
      };
    } else {
      return {
        ok: false,
        status: 401,
      };
    }
  }

  return {
    ok: false,
    status: 404,
  };
};

// Mock crypto for testing
global.crypto = {
  subtle: {
    importKey: async (algorithm, keyBuffer, extractable, usages) => {
      return "mock-crypto-key";
    },
    decrypt: async (algorithm, key, data) => {
      return new TextEncoder().encode("decrypted-data");
    },
  },
};

// Test the decryption service
async function testDecryptionService() {
  try {
    console.log("Testing DecryptionService...");

    // Test getting encryption key
    const key = await DecryptionService.getEncryptionKey();
    console.log(
      "✅ Encryption key retrieved successfully:",
      key ? "Yes" : "No"
    );

    // Test decrypting PII data
    const mockEncryptedData = Buffer.from(
      JSON.stringify({
        encrypted: "test-encrypted",
        iv: "test-iv",
        tag: "test-tag",
      })
    ).toString("base64");

    const decrypted = await DecryptionService.decryptPII(mockEncryptedData);
    console.log("✅ PII decryption successful:", decrypted);

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testDecryptionService();
