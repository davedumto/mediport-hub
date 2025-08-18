/**
 * Debug script to see what the encrypted data actually looks like
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugEncryptedData() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ejeredavid2001@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('='.repeat(60));
    console.log('ENCRYPTED DATA DEBUG');
    console.log('='.repeat(60));
    
    console.log('User ID:', user.id);
    console.log('Plain text fields:');
    console.log('  firstName:', user.firstName);
    console.log('  lastName:', user.lastName);
    console.log('  specialty:', user.specialty);
    console.log('  medicalLicenseNumber:', user.medicalLicenseNumber);
    
    console.log('\nEncrypted fields (raw):');
    console.log('  firstNameEncrypted length:', user.firstNameEncrypted?.length);
    console.log('  firstNameEncrypted (first 50 chars):', user.firstNameEncrypted?.toString().substring(0, 50));
    
    console.log('\nTrying to parse as string:');
    if (user.firstNameEncrypted) {
      try {
        const asString = user.firstNameEncrypted.toString();
        console.log('  As string:', asString.substring(0, 100));
        const parsed = JSON.parse(asString);
        console.log('  Parsed JSON:', parsed);
      } catch (error) {
        console.log('  Parse error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEncryptedData();