import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { UserRole, UserStatus } from "@petcare/types";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@petcare.local";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const password = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.create({
    data: {
      name: "PetCare Admin",
      email: adminEmail,
      password,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Seeded admin user: ${adminEmail} / ChangeMe123!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
