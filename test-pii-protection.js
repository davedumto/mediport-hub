// Use native fetch (available in Node 18+)

const API_BASE = 'http://localhost:3000/api';

// Test credentials (you may need to update these based on your seed data)
const TEST_USER = {
  email: 'dr.smith@edith.com',
  password: 'Doctor123!'
};

let accessToken = null;
let userId = null;

async function testLogin() {
  console.log('\n🔐 Testing Login Endpoint...');
  console.log('================================');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      
      // Check for PII exposure
      const piiFields = ['firstName', 'lastName', 'email', 'phone', 'passwordHash', 'mfaSecret'];
      const exposedFields = piiFields.filter(field => data.user && data.user[field]);
      
      if (exposedFields.length > 0) {
        console.log('⚠️  WARNING: PII fields exposed in login response:', exposedFields);
      } else {
        console.log('✅ No PII exposed in login response');
      }
      
      // Store tokens for next tests
      accessToken = data.accessToken;
      userId = data.user?.id;
      
      return true;
    } else {
      console.log('❌ Login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing login:', error.message);
    return false;
  }
}

async function testProfile() {
  console.log('\n👤 Testing Profile Endpoint...');
  console.log('================================');
  
  if (!accessToken) {
    console.log('⚠️  No access token available, skipping profile test');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Profile fetched successfully!');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      
      // Check if PII is masked
      const user = data.data?.user;
      if (user) {
        console.log('\n🔍 PII Masking Check:');
        console.log(`  Email: ${user.email} ${user.email?.includes('*') ? '✅ Masked' : '⚠️  Not masked'}`);
        console.log(`  First Name: ${user.firstName} ${user.firstName?.includes('*') ? '✅ Masked' : '⚠️  Not masked'}`);
        console.log(`  Last Name: ${user.lastName} ${user.lastName?.includes('*') ? '✅ Masked' : '⚠️  Not masked'}`);
        console.log(`  Phone: ${user.phone} ${(!user.phone || user.phone?.includes('*')) ? '✅ Masked/Hidden' : '⚠️  Not masked'}`);
        
        // Check for sensitive fields that should never be exposed
        const sensitiveFields = ['passwordHash', 'mfaSecret', 'passwordHistory'];
        const exposedSensitive = sensitiveFields.filter(field => user[field]);
        
        if (exposedSensitive.length > 0) {
          console.log('🚨 CRITICAL: Sensitive fields exposed:', exposedSensitive);
        } else {
          console.log('✅ No sensitive fields exposed');
        }
      }
      
      return true;
    } else {
      console.log('❌ Profile fetch failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing profile:', error.message);
    return false;
  }
}

async function testDecryptProfile() {
  console.log('\n🔓 Testing Profile Decryption Endpoint...');
  console.log('================================');
  
  if (!accessToken) {
    console.log('⚠️  No access token available, skipping decryption test');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/decrypt-profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Profile decrypted successfully!');
      console.log('📊 Decrypted data:', JSON.stringify(data, null, 2));
      
      // Check if PII is actually decrypted (no masking)
      const user = data.data?.user;
      if (user) {
        console.log('\n🔍 Decryption Check:');
        console.log(`  Email: ${user.email} ${!user.email?.includes('*') ? '✅ Decrypted' : '⚠️  Still masked'}`);
        console.log(`  First Name: ${user.firstName} ${!user.firstName?.includes('*') ? '✅ Decrypted' : '⚠️  Still masked'}`);
        console.log(`  Last Name: ${user.lastName} ${!user.lastName?.includes('*') ? '✅ Decrypted' : '⚠️  Still masked'}`);
      }
      
      return true;
    } else {
      console.log('❌ Profile decryption failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing profile decryption:', error.message);
    return false;
  }
}

async function testDecryptField() {
  console.log('\n🔓 Testing Field Decryption Endpoint...');
  console.log('================================');
  
  if (!accessToken || !userId) {
    console.log('⚠️  No access token or user ID available, skipping field decryption test');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/decrypt-field`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entityType: 'user',
        entityId: userId,
        fields: ['firstName', 'lastName', 'email']
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Fields decrypted successfully!');
      console.log('📊 Decrypted fields:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('❌ Field decryption failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing field decryption:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting PII Protection Tests');
  console.log('==================================');
  console.log('Testing against:', API_BASE);
  
  // Run tests in sequence
  const loginSuccess = await testLogin();
  
  if (loginSuccess) {
    await testProfile();
    await testDecryptProfile();
    await testDecryptField();
  }
  
  console.log('\n📋 Test Summary');
  console.log('================================');
  console.log('✅ Tests completed. Review the output above for any PII exposure issues.');
}

// Run the tests
runTests().catch(console.error);