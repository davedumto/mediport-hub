/**
 * Script to test PII decryption without frontend
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDecryption() {
  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: 'ejeredavid2001@gmail.com' },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ Found user:', user.id);
    
    // Let me directly test the decryption logic first by testing the service
    console.log('Testing parseEncryptedData directly...');
    
    if (user.firstNameEncrypted) {
      console.log('firstNameEncrypted type:', typeof user.firstNameEncrypted);
      console.log('firstNameEncrypted instanceof Uint8Array:', user.firstNameEncrypted instanceof Uint8Array);
      
      // Try the parsing logic
      let encryptedData;
      if (Buffer.isBuffer(user.firstNameEncrypted)) {
        const bufferString = Buffer.from(user.firstNameEncrypted).toString('utf8');
        encryptedData = JSON.parse(bufferString);
      } else if (typeof user.firstNameEncrypted === 'string') {
        encryptedData = JSON.parse(user.firstNameEncrypted);
      } else if (user.firstNameEncrypted instanceof Uint8Array) {
        // Handle Uint8Array from database - convert to proper buffer first
        const buffer = Buffer.from(user.firstNameEncrypted);
        const bufferString = buffer.toString('utf8');
        encryptedData = JSON.parse(bufferString);
        console.log('Parsed encrypted data:', encryptedData);
      } else {
        encryptedData = user.firstNameEncrypted;
      }
      
      if (encryptedData && encryptedData.encryptedData && encryptedData.iv && encryptedData.tag) {
        console.log('✅ Successfully parsed encrypted data structure');
        console.log('encryptedData:', encryptedData.encryptedData?.substring(0, 10) + '...');
        console.log('iv:', encryptedData.iv?.substring(0, 10) + '...');
        console.log('tag:', encryptedData.tag?.substring(0, 10) + '...');
      } else {
        console.log('❌ Invalid encrypted data structure');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDecryption();