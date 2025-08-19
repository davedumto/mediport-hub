const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const speakeasy = require('speakeasy');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const email = 'admin@edith.com';
    const password = 'Admin123!';
    const firstName = 'System';
    const lastName = 'Administrator';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('❌ Super admin already exists with email:', email);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate MFA secret
    const mfaSecret = speakeasy.generateSecret({
      name: `EHR System (${email})`,
      length: 32,
    }).base32;

    // Create super admin user
    const admin = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        role: 'SUPER_ADMIN',
        verificationStatus: 'VERIFIED', // Super admin should be pre-verified
        mfaSecret,
        mfaEnabled: false,
        isActive: true,
        emailVerified: true,
        failedLoginAttempts: 0,
        passwordHistory: [],
        // No encrypted fields needed for super admin
        firstNameEncrypted: null,
        lastNameEncrypted: null,
        emailEncrypted: null,
      },
    });

    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', admin.role);
    console.log('🆔 User ID:', admin.id);

    // Create GDPR consent record for admin
    await prisma.consentRecord.create({
      data: {
        userId: admin.id,
        consentType: 'DATA_PROCESSING',
        purpose: 'System administration and management',
        granted: true,
        consentText: 'Admin user consent for system administration',
        consentVersion: '1.0',
        legalBasis: 'LEGITIMATE_INTERESTS',
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
      },
    });

    console.log('✅ Consent record created');
    console.log('\n🚀 Super admin is ready to use!');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();