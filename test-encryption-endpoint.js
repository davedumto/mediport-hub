// Test script for encryption endpoint
const crypto = require("crypto");

// Generate a test JWT token (this is just for testing)
function generateTestJWT(payload, secret = "test-secret") {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
    "base64url"
  );
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Test payload
const testPayload = {
  userId: "test-user-123",
  email: "test@example.com",
  role: "PATIENT",
  permissions: ["RECORD_READ_OWN"],
  sessionId: "test-session-123",
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};

// Generate test token
const testToken = generateTestJWT(testPayload);

console.log("Test JWT Token:", testToken);
console.log("Testing encryption endpoint...");

// Test the endpoint
async function testEndpoint() {
  try {
    const response = await fetch("http://localhost:3000/api/encryption/key", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
    });

    console.log("Response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success:", data);
    } else {
      const error = await response.json();
      console.log("❌ Error:", error);
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

// Run test
testEndpoint();
