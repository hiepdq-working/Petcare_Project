import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { UserRole, UserStatus } from "@petcare/types";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "ChangeMe123!";

// One ready-to-use account per role so a fresh `docker compose up` (or a
// fresh local DB) can be logged into immediately — see docs/LOGIN_GUIDE.md.
// Each block is independently idempotent (checked by email/relation, not
// a single early-return) so re-running the seed after a partial run still
// fills in whatever's missing instead of silently skipping everything.
async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // --- Admin ---
  await prisma.user.upsert({
    where: { email: "admin@petcare.local" },
    update: {},
    create: {
      name: "PetCare Admin",
      email: "admin@petcare.local",
      password: passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  // --- Hospital Owner + their Hospital ---
  const hospitalOwner = await prisma.user.upsert({
    where: { email: "hospital@petcare.local" },
    update: {},
    create: {
      name: "Chủ Phòng Khám Demo",
      email: "hospital@petcare.local",
      password: passwordHash,
      role: UserRole.HOSPITAL_OWNER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  let hospital = await prisma.hospital.findFirst({ where: { ownerId: hospitalOwner.id } });
  if (!hospital) {
    hospital = await prisma.hospital.create({
      data: {
        ownerId: hospitalOwner.id,
        name: "PetCare Demo Clinic",
        description: "Phòng khám mẫu để dùng thử ứng dụng PetCare.",
        address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        lat: 10.7769,
        lng: 106.7009,
        phone: "0900000000",
        email: "hospital@petcare.local",
        status: "ACTIVE",
        isEmergency: true,
      },
    });
  }

  const existingService = await prisma.service.findFirst({ where: { hospitalId: hospital.id } });
  if (!existingService) {
    await prisma.service.create({
      data: {
        providerType: "HOSPITAL",
        hospitalId: hospital.id,
        name: "Khám tổng quát",
        description: "Kiểm tra sức khoẻ định kỳ cho thú cưng.",
        price: 200000,
        duration: 30,
      },
    });
  }

  // --- Vet, under the demo hospital ---
  const vetUser = await prisma.user.upsert({
    where: { email: "vet@petcare.local" },
    update: {},
    create: {
      name: "BS. Demo",
      email: "vet@petcare.local",
      password: passwordHash,
      role: UserRole.VET,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const existingVet = await prisma.veterinarian.findUnique({ where: { userId: vetUser.id } });
  if (!existingVet) {
    await prisma.veterinarian.create({
      data: {
        hospitalId: hospital.id,
        userId: vetUser.id,
        specialty: "Nội tổng quát",
        experience: 5,
        status: "ACTIVE",
      },
    });
  }

  // --- Pet Owner + their Pet ---
  const petOwner = await prisma.user.upsert({
    where: { email: "owner@petcare.local" },
    update: {},
    create: {
      name: "Chủ Nuôi Demo",
      email: "owner@petcare.local",
      password: passwordHash,
      role: UserRole.PET_OWNER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const existingPet = await prisma.pet.findFirst({ where: { ownerId: petOwner.id } });
  if (!existingPet) {
    await prisma.pet.create({
      data: {
        ownerId: petOwner.id,
        name: "Miu",
        species: "Mèo",
        breed: "Mèo ta",
      },
    });
  }

  console.log("Seeded demo accounts (password for all: %s):", DEMO_PASSWORD);
  console.log("  Admin          admin@petcare.local");
  console.log("  Hospital Owner hospital@petcare.local");
  console.log("  Vet            vet@petcare.local");
  console.log("  Pet Owner      owner@petcare.local");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
