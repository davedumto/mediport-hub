import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupUserData(userId: string) {
  try {
    console.log(`Starting cleanup for user: ${userId}`);

    // 1. Delete consent records first
    const deletedConsents = await prisma.consentRecord.deleteMany({
      where: { userId },
    });
    console.log(`Deleted ${deletedConsents.count} consent records`);

    // 2. Delete patient record if exists
    const deletedPatients = await prisma.patient.deleteMany({
      where: { userId },
    });
    console.log(`Deleted ${deletedPatients.count} patient records`);

    // 3. Delete audit logs
    const deletedAudits = await prisma.auditLog.deleteMany({
      where: { userId },
    });
    console.log(`Deleted ${deletedAudits.count} audit logs`);

    // 4. Finally delete the user
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });
    console.log(`Successfully deleted user: ${deletedUser.email}`);

    console.log("User cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);

    if (error.code === "P2025") {
      console.log("User not found or already deleted");
    } else if (error.code === "P2003") {
      console.log(
        "Still have foreign key constraints. Check for other related tables."
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: Replace 'user-id-here' with the actual user ID you want to delete
const userIdToDelete = "user-id-here"; // CHANGE THIS!

if (userIdToDelete === "user-id-here") {
  console.log(
    "Please update the userIdToDelete variable with the actual user ID"
  );
  process.exit(1);
}

cleanupUserData(userIdToDelete);
