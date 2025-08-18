/**
 * Script to fix encrypted data format issue
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEncryptedData() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ejeredavid2001@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('='.repeat(60));
    console.log('FIXING ENCRYPTED DATA');
    console.log('='.repeat(60));
    
    // First, let's see what the raw data looks like
    console.log('Raw firstNameEncrypted type:', typeof user.firstNameEncrypted);
    console.log('Raw firstNameEncrypted:', user.firstNameEncrypted);
    
    // Try to convert the comma-separated values back to proper buffer
    if (user.firstNameEncrypted) {
      const bufferString = user.firstNameEncrypted.toString();
      console.log('\nBuffer as string:', bufferString);
      
      try {
        // If it's comma-separated numbers, convert them back to a buffer, then to string
        if (bufferString.includes(',') && /^\d+(,\d+)*$/.test(bufferString)) {
          console.log('Detected comma-separated format, converting...');
          const bytes = bufferString.split(',').map(num => parseInt(num, 10));
          const properBuffer = Buffer.from(bytes);
          const properString = properBuffer.toString('utf8');
          console.log('Converted string:', properString);
          
          try {
            const parsed = JSON.parse(properString);
            console.log('Parsed object:', parsed);
            console.log('Has encryptedData:', !!parsed.encryptedData);
            console.log('Has iv:', !!parsed.iv);
            console.log('Has tag:', !!parsed.tag);
          } catch (parseError) {
            console.log('Parse error:', parseError.message);
          }
        } else {
          // Try parsing directly
          const parsed = JSON.parse(bufferString);
          console.log('Direct parsed object:', parsed);
        }
      } catch (error) {
        console.log('Conversion error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEncryptedData();