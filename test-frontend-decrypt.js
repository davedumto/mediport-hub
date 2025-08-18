/**
 * Test script that can be run in the browser console to test frontend decryption
 * This should be copied and pasted into the browser console while logged in
 */

console.log('Testing frontend PII decryption...');

// Get stored auth tokens from localStorage
const storedTokens = localStorage.getItem('auth_tokens');
if (!storedTokens) {
  console.error('❌ No auth tokens found in localStorage');
} else {
  console.log('✅ Found auth tokens in localStorage');
  
  const tokens = JSON.parse(storedTokens);
  console.log('Access token present:', !!tokens.accessToken);
  
  // Get user ID from current user context (if available in window)
  // Or we can hardcode it since we know it
  const userId = '27000e15-edb9-4507-9742-76ab8c4f6f52';
  
  // Test the decrypt-profile endpoint
  fetch(`/api/auth/decrypt-profile?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Decryption successful!');
      console.log('Decrypted user data:');
      console.log('- First Name:', data.data.user.firstName);
      console.log('- Last Name:', data.data.user.lastName);
      console.log('- Email:', data.data.user.email);
      console.log('- Phone:', data.data.user.phone);
      console.log('- Specialty:', data.data.user.specialty);
      console.log('- License:', data.data.user.medicalLicenseNumber);
    } else {
      console.error('❌ Decryption failed:', data);
    }
  })
  .catch(error => {
    console.error('❌ Request failed:', error);
  });
}