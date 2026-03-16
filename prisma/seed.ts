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

  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminPassword) {
    console.warn("ADMIN_INITIAL_PASSWORD not set, skipping admin upsert.");
  } else {
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: "admin@bilalhocayds.com" },
      update: {
        name: "Platform Admin",
        role: "ADMIN",
        password: adminHash,
      },
      create: {
        name: "Platform Admin",
        email: "admin@bilalhocayds.com",
        role: "ADMIN",
        password: adminHash,
      },
    });
    console.log("Admin user upserted.");
  }

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