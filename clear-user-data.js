/**
 * Script to clear all user data from the database
 * WARNING: This will delete ALL users and related data!
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearUserData() {
  console.log('⚠️  WARNING: This will delete ALL user data from the database!');
  console.log('Starting cleanup...\n');

  const deletions = [
    { name: 'audit logs', fn: () => prisma.auditLog.deleteMany({}) },
    { name: 'user sessions', fn: () => prisma.userSession.deleteMany({}) },
    { name: 'password resets', fn: () => prisma.passwordReset.deleteMany({}) },
    { name: 'verification codes', fn: () => prisma.verificationCode.deleteMany({}) },
    { name: 'consent records', fn: () => prisma.consentRecord.deleteMany({}) },
    { name: 'consultations', fn: () => prisma.consultation.deleteMany({}) },
    { name: 'appointments', fn: () => prisma.appointment.deleteMany({}) },
    { name: 'medical records', fn: () => prisma.medicalRecord.deleteMany({}) },
    { name: 'feedback', fn: () => prisma.feedback.deleteMany({}) },
    { name: 'system reviews', fn: () => prisma.systemReview.deleteMany({}) },
    { name: 'user role assignments', fn: () => prisma.userRoleAssignment.deleteMany({}) },
    { name: 'patients', fn: () => prisma.patient.deleteMany({}) },
    { name: 'users', fn: () => prisma.user.deleteMany({}) },
  ];

  let index = 1;
  for (const deletion of deletions) {
    console.log(`${index}. Deleting ${deletion.name}...`);
    try {
      const result = await deletion.fn();
      console.log(`   ✅ Deleted ${result.count} ${deletion.name}`);
    } catch (error) {
      if (error.code === 'P2021') {
        console.log(`   ⚠️  Table for ${deletion.name} doesn't exist, skipping...`);
      } else {
        console.log(`   ❌ Error deleting ${deletion.name}: ${error.message}`);
      }
    }
    index++;
  }

  console.log('\n✅ Successfully cleared all user data from the database!');
  console.log('You can now create new users with proper encryption.');

  await prisma.$disconnect();
}

// Run the cleanup
clearUserData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });