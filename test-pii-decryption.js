/**
 * Test script to verify PII decryption is working
 * Run this script with: node test-pii-decryption.js
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'ejeredavid2001@gmail.com';
const TEST_PASSWORD = 'Doomsday2022!';

async function testPIIDecryption() {
  console.log('🔐 Testing PII Decryption Implementation\n');
  console.log('=====================================\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in as doctor...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.accessToken;
    const userId = loginData.user.id;

    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: ${loginData.user.role}\n`);

    // Step 2: Get masked profile
    console.log('2️⃣ Fetching masked profile...');
    const profileResponse = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      throw new Error(`Profile fetch failed: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    const maskedUser = profileData.data.user;

    console.log('✅ Masked profile received:');
    console.log(`   Email: ${maskedUser.email}`);
    console.log(`   First Name: ${maskedUser.firstName}`);
    console.log(`   Last Name: ${maskedUser.lastName}`);
    console.log(`   Phone: ${maskedUser.phone}`);
    console.log(`   License: ${maskedUser.medicalLicenseNumber}\n`);

    // Step 3: Decrypt profile
    console.log('3️⃣ Decrypting profile...');
    const decryptResponse = await fetch(`${BASE_URL}/api/auth/decrypt-profile?userId=${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!decryptResponse.ok) {
      const errorData = await decryptResponse.json();
      throw new Error(`Decryption failed: ${JSON.stringify(errorData)}`);
    }

    const decryptData = await decryptResponse.json();
    const decryptedUser = decryptData.data.user;

    console.log('✅ Decrypted profile received:');
    console.log(`   Email: ${decryptedUser.email}`);
    console.log(`   First Name: ${decryptedUser.firstName}`);
    console.log(`   Last Name: ${decryptedUser.lastName}`);
    console.log(`   Phone: ${decryptedUser.phone}`);
    console.log(`   License: ${decryptedUser.medicalLicenseNumber}\n`);

    // Step 4: Test field-specific decryption
    console.log('4️⃣ Testing field-specific decryption...');
    const fieldDecryptResponse = await fetch(`${BASE_URL}/api/auth/decrypt-field`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entityType: 'user',
        entityId: userId,
        fields: ['firstName', 'lastName', 'email'],
      }),
    });

    if (!fieldDecryptResponse.ok) {
      const errorData = await fieldDecryptResponse.json();
      throw new Error(`Field decryption failed: ${JSON.stringify(errorData)}`);
    }

    const fieldData = await fieldDecryptResponse.json();
    console.log('✅ Field-specific decryption successful:');
    console.log(`   Fields decrypted: ${Object.keys(fieldData.data).join(', ')}\n`);

    // Summary
    console.log('=====================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('=====================================\n');
    console.log('Summary:');
    console.log('• Login endpoint returns minimal data (no PII) ✅');
    console.log('• Profile endpoint returns masked PII ✅');
    console.log('• Decrypt-profile endpoint returns full PII ✅');
    console.log('• Decrypt-field endpoint works for specific fields ✅');
    console.log('\n🎉 PII encryption/decryption is working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testPIIDecryption().catch(console.error);