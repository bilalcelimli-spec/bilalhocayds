import "dotenv/config";
import bcrypt from "bcrypt";

import { prisma } from "../lib/prisma";

async function main() {
  await prisma.plan.upsert({
    where: { slug: "basic" },
    update: {},
    create: {
      name: "Basic",
      slug: "basic",
      description: "Kelime + Reading",
      monthlyPrice: 299,
      yearlyPrice: 2990,
      includesVocab: true,
      includesReading: true,
      includesGrammar: false,
      includesAIPlanner: false,
      includesLiveClass: false,
    },
  });

  await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Pro",
      slug: "pro",
      description: "Kelime + Reading + Grammar + AI Planner",
      monthlyPrice: 499,
      yearlyPrice: 4990,
      includesVocab: true,
      includesReading: true,
      includesGrammar: true,
      includesAIPlanner: true,
      includesLiveClass: false,
    },
  });

  await prisma.plan.upsert({
    where: { slug: "premium" },
    update: {},
    create: {
      name: "Premium",
      slug: "premium",
      description: "Tum moduller + canli dersler",
      monthlyPrice: 799,
      yearlyPrice: 7990,
      includesVocab: true,
      includesReading: true,
      includesGrammar: true,
      includesAIPlanner: true,
      includesLiveClass: true,
    },
  });

  const defaultPasswordHash = await bcrypt.hash("Bilal12345", 10);

  await prisma.user.upsert({
    where: { email: "admin@bilalhocayds.com" },
    update: {
      name: "Platform Admin",
      role: "ADMIN",
      password: defaultPasswordHash,
    },
    create: {
      name: "Platform Admin",
      email: "admin@bilalhocayds.com",
      role: "ADMIN",
      password: defaultPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "ogrenci@bilalhocayds.com" },
    update: {
      name: "Demo Ogrenci",
      role: "STUDENT",
      password: defaultPasswordHash,
      studentProfile: {
        upsert: {
          create: {},
          update: {},
        },
      },
    },
    create: {
      name: "Demo Ogrenci",
      email: "ogrenci@bilalhocayds.com",
      role: "STUDENT",
      password: defaultPasswordHash,
      studentProfile: {
        create: {},
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "egitmen@bilalhocayds.com" },
    update: {
      name: "Demo Egitmen",
      role: "TEACHER",
      password: defaultPasswordHash,
      teacherProfile: {
        upsert: {
          create: {
            isActive: true,
          },
          update: {
            isActive: true,
          },
        },
      },
    },
    create: {
      name: "Demo Egitmen",
      email: "egitmen@bilalhocayds.com",
      role: "TEACHER",
      password: defaultPasswordHash,
      teacherProfile: {
        create: {
          isActive: true,
        },
      },
    },
  });

  console.log("Seed tamamlandi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });