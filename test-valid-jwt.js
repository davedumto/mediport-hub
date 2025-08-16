// Test script with valid JWT token
const crypto = require("crypto");

// Use the actual JWT secret from your environment
const JWT_SECRET =
  "1a8497bbcb7e2f1a44b77d6ade867b22c3ea13be003f081f38dca480ccac936c";

// Generate a valid JWT token
function generateValidJWT(payload, secret) {
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

// Test payload matching your JWT structure
const testPayload = {
  userId: "test-user-123",
  email: "test@example.com",
  role: "PATIENT",
  permissions: ["RECORD_READ_OWN"],
  sessionId: "test-session-123",
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  iat: Math.floor(Date.now() / 1000),
  iss: "ehr-system",
  aud: "ehr-api",
};

// Generate valid token
const validToken = generateValidJWT(testPayload, JWT_SECRET);

console.log("Valid JWT Token:", validToken);
console.log("Testing encryption endpoint with valid token...");

// Test the endpoint
async function testValidEndpoint() {
  try {
    const response = await fetch("http://localhost:3000/api/encryption/key", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validToken}`,
      },
    });

    console.log("Response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success:", data);
      console.log("✅ Encryption key retrieved:", data.key ? "Yes" : "No");
    } else {
      const error = await response.json();
      console.log("❌ Error:", error);
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

// Run test
testValidEndpoint();

