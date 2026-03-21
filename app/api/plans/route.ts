import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// Herkese açık plan listesi (aktif planlar)
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        monthlyPrice: true,
        yearlyPrice: true,
        includesLiveClass: true,
        includesAIPlanner: true,
        includesReading: true,
        includesGrammar: true,
        includesVocab: true,
        includesExam: true,
      },
    });

    // Mobil uygulamanın beklediği formata dönüştür
    const formatted = plans.map((plan) => {
      const features: string[] = [];
      if (plan.includesVocab) features.push("AI Vocabulary Engine");
      if (plan.includesReading) features.push("AI Reading Practice");
      if (plan.includesGrammar) features.push("AI Grammar Trainer");
      if (plan.includesExam) features.push("Sınav Modülü");
      if (plan.includesLiveClass) features.push("Canlı Dersler");
      if (plan.includesAIPlanner) features.push("AI Çalışma Planlayıcı");

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        price: plan.monthlyPrice,
        description: plan.description,
        features,
        isPopular: plan.slug === "premium",
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("[plans] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
