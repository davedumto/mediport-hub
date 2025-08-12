#!/usr/bin/env ts-node

import { initializeSystemRoles } from "../lib/permissions";
import { RoleService } from "../services/roleService";
import { RoleStatistics } from "../types/auth";
import prisma from "../lib/db";

async function initializeRBAC() {
  try {
    console.log("Initializing RBAC System...");

    // Initialize system roles
    console.log("Creating system roles...");
    await initializeSystemRoles();
    console.log("System roles created successfully");

    // Create a super admin user if none exists
    console.log("Checking for super admin user...");
    const superAdminExists = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (!superAdminExists) {
      console.log("Creating super admin user...");
      const superAdmin = await prisma.user.create({
        data: {
          email: "superadmin@ehr.local",
          passwordHash:
            "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Gi", // 'SuperAdmin123!'
          firstName: "Super",
          lastName: "Administrator",
          role: "SUPER_ADMIN",
          isActive: true,
          emailVerified: true,
        },
      });

      console.log(`Super admin user created: ${superAdmin.email}`);
      console.log("Default password: SuperAdmin123!");
      console.log(
        "⚠️  Please change this password immediately after first login!"
      );
    } else {
      console.log("Super admin user already exists");
    }

    // Display role statistics
    console.log("RBAC System Statistics:");
    const stats = await RoleService.getRoleStatistics();
    stats.forEach((role: RoleStatistics) => {
      console.log(`  - ${role.name}: ${role.userCount} users`);
    });

    console.log("\nRBAC System initialization completed successfully!");
  } catch (error) {
    console.error("Failed to initialize RBAC system:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
if (require.main === module) {
  initializeRBAC();
}

export { initializeRBAC };
