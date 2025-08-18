/**
 * Script to get the current valid OTP for a user
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getOTP() {
  try {
    const email = 'ejeredavid2001@gmail.com';
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.id}`);
    
    // Get the most recent valid verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        isUsed: false,
        expiresAt: {
          gt: new Date() // Still valid (not expired)
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!verificationCode) {
      console.log('❌ No valid verification code found');
      console.log('The OTP may have expired or already been used.');
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🔐 CURRENT VALID OTP');
    console.log('='.repeat(50));
    console.log(`Email: ${email}`);
    console.log(`OTP: ${verificationCode.code}`);
    console.log(`Created: ${verificationCode.createdAt}`);
    console.log(`Expires: ${verificationCode.expiresAt}`);
    console.log(`Used: ${verificationCode.isUsed}`);
    console.log('='.repeat(50));
    
    const timeLeft = Math.ceil((verificationCode.expiresAt - new Date()) / 1000 / 60);
    console.log(`⏰ Time remaining: ${timeLeft} minutes`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getOTP();