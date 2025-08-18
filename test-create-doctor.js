/**
 * Create a test doctor account for testing PII decryption
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function createTestDoctor() {
  console.log('Creating test doctor account...\n');

  try {
    // Register a doctor account
    const response = await fetch(`${BASE_URL}/api/auth/register/doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'John Smith',
        email: 'testdoctor@example.com',
        password: 'TestDoctor123!',
        specialty: 'Internal Medicine',
        medicalLicenseNumber: 'MD123456789',
        gdprConsent: true,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Doctor account created successfully!');
      console.log(`   Email: testdoctor@example.com`);
      console.log(`   Password: TestDoctor123!`);
      console.log(`   User ID: ${data.user ? data.user.id : 'N/A'}`);
    } else {
      console.log('❌ Registration failed:', data.message || data.error);
      console.log('   Details:', JSON.stringify(data.details || data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestDoctor().catch(console.error);