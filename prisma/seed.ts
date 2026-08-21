import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const trackDefs = [
    { slug: "investment-banking", name: "Investment Banking", status: "live" },
    { slug: "private-equity", name: "Private Equity", status: "live" },
    { slug: "product-management", name: "Product Management", status: "coming_soon" },
    { slug: "software-engineering", name: "Software Engineering", status: "coming_soon" },
    { slug: "data-analysis", name: "Data Analysis", status: "coming_soon" },
  ];

  for (const t of trackDefs) {
    await prisma.track.upsert({
      where: { slug: t.slug },
      update: { name: t.name, status: t.status },
      create: t,
    });
  }

  const liveTrackSlugs = ["investment-banking", "private-equity"];

  for (const trackSlug of liveTrackSlugs) {
    const track = await prisma.track.findUniqueOrThrow({ where: { slug: trackSlug } });

    const fitParent = await prisma.category.upsert({
      where: { trackId_slug: { trackId: track.id, slug: "fit-behavioral" } },
      update: { name: "Fit & Behavioral" },
      create: { trackId: track.id, slug: "fit-behavioral", name: "Fit & Behavioral" },
    });

    const technicalParent = await prisma.category.upsert({
      where: { trackId_slug: { trackId: track.id, slug: "technical" } },
      update: { name: "Technical" },
      create: { trackId: track.id, slug: "technical", name: "Technical" },
    });

    const whyThisCareer = await prisma.category.upsert({
      where: { trackId_slug: { trackId: track.id, slug: "why-this-career" } },
      update: { name: "Why This Career", parentCategoryId: fitParent.id },
      create: {
        trackId: track.id,
        slug: "why-this-career",
        name: "Why This Career",
        parentCategoryId: fitParent.id,
      },
    });

    const strengthsWeaknesses = await prisma.category.upsert({
      where: { trackId_slug: { trackId: track.id, slug: "strengths-weaknesses" } },
      update: { name: "Strengths & Weaknesses", parentCategoryId: fitParent.id },
      create: {
        trackId: track.id,
        slug: "strengths-weaknesses",
        name: "Strengths & Weaknesses",
        parentCategoryId: fitParent.id,
      },
    });

    const valuationBasics = await prisma.category.upsert({
      where: { trackId_slug: { trackId: track.id, slug: "valuation-basics" } },
      update: { name: "Valuation Basics", parentCategoryId: technicalParent.id },
      create: {
        trackId: track.id,
        slug: "valuation-basics",
        name: "Valuation Basics",
        parentCategoryId: technicalParent.id,
      },
    });

    const leafCategoryIds = [whyThisCareer.id, strengthsWeaknesses.id, valuationBasics.id];
    await prisma.question.deleteMany({ where: { categoryId: { in: leafCategoryIds } } });

    const questionSeeds = [
      {
        categoryId: whyThisCareer.id,
        difficulty: "basic",
        prompt:
          "Why do you want to work in this field rather than a related one like consulting or corporate finance?",
        modelAnswer:
          "Anchor the answer in a specific moment that pulled you toward the work itself — a deal, a project, or a conversation with someone in the seat — rather than the lifestyle or compensation. Name one concrete thing you've done to test that interest (a class, a case competition, an informational interview) and tie it back to what you'd actually be doing day to day in this role.",
      },
      {
        categoryId: whyThisCareer.id,
        difficulty: "basic",
        prompt: "Walk me through your resume.",
        modelAnswer:
          "Keep it chronological and under three minutes. For each step, give the one-sentence reason it led to the next, and end with a clear statement of why you're sitting in this interview today. Avoid narrating every bullet point on the page — the interviewer can read; they want the connective logic.",
      },
      {
        categoryId: strengthsWeaknesses.id,
        difficulty: "basic",
        prompt: "What's a real weakness you're working on, and how are you addressing it?",
        modelAnswer:
          "Pick something true but not disqualifying — e.g. a tendency to over-polish work past the point of diminishing returns — and spend most of the answer on the specific, current habit you've built to counter it (a checklist, a time-box, asking for a second read). Avoid disguised strengths like 'I work too hard.'",
      },
      {
        categoryId: valuationBasics.id,
        difficulty: "basic",
        prompt: "What's the difference between Enterprise Value and Equity Value?",
        modelAnswer:
          "Equity Value is the value of the business attributable only to shareholders — share price times shares outstanding. Enterprise Value represents the value of the whole business attributable to all capital providers: Equity Value plus debt and preferred stock, minus cash, because a buyer effectively inherits the seller's debt obligations but also its cash.",
      },
      {
        categoryId: valuationBasics.id,
        difficulty: "basic",
        prompt: "Name the three core valuation methodologies and one weakness of each.",
        modelAnswer:
          "Comparable Companies (trading multiples of similar public companies) can be distorted by short-term market sentiment. Precedent Transactions (multiples paid in past M&A deals) go stale as market conditions change and rarely find a perfectly comparable deal. Discounted Cash Flow (present value of projected cash flows) is highly sensitive to the terminal value and discount rate assumptions.",
      },
    ];

    for (const q of questionSeeds) {
      await prisma.question.create({ data: q });
    }
  }

  console.log("Seeded PrepDecks database.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
