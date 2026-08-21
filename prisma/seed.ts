import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function upsertCategory(
  trackId: string,
  slug: string,
  name: string,
  parentCategoryId?: string
) {
  return prisma.category.upsert({
    where: { trackId_slug: { trackId, slug } },
    update: { name, parentCategoryId },
    create: { trackId, slug, name, parentCategoryId },
  });
}

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

    const fitParent = await upsertCategory(track.id, "fit-behavioral", "Fit & Behavioral");
    const technicalParent = await upsertCategory(track.id, "technical", "Technical");

    const whyThisCareer = await upsertCategory(
      track.id,
      "why-this-career",
      "Why This Career",
      fitParent.id
    );
    const strengthsWeaknesses = await upsertCategory(
      track.id,
      "strengths-weaknesses",
      "Strengths & Weaknesses",
      fitParent.id
    );

    await prisma.question.deleteMany({
      where: { categoryId: { in: [whyThisCareer.id, strengthsWeaknesses.id] } },
    });

    const fitQuestionSeeds = [
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
    ];

    for (const q of fitQuestionSeeds) {
      await prisma.question.create({ data: q });
    }

    if (trackSlug === "investment-banking") {
      const accounting = await upsertCategory(track.id, "accounting", "Accounting", technicalParent.id);
      const evEquityValue = await upsertCategory(
        track.id,
        "enterprise-equity-value",
        "Enterprise Value & Equity Value",
        technicalParent.id
      );
      const valuation = await upsertCategory(
        track.id,
        "valuation-comps-precedents",
        "Valuation (Comps & Precedent Transactions)",
        technicalParent.id
      );
      const dcf = await upsertCategory(track.id, "dcf", "DCF", technicalParent.id);
      const mergerModels = await upsertCategory(
        track.id,
        "merger-models",
        "Merger Models",
        technicalParent.id
      );
      const lboModels = await upsertCategory(track.id, "lbo-models", "LBO Models", technicalParent.id);
      const brainTeasers = await upsertCategory(
        track.id,
        "brain-teasers",
        "Brain Teasers",
        technicalParent.id
      );

      const technicalLeafIds = [
        accounting.id,
        evEquityValue.id,
        valuation.id,
        dcf.id,
        mergerModels.id,
        lboModels.id,
        brainTeasers.id,
      ];
      await prisma.question.deleteMany({ where: { categoryId: { in: technicalLeafIds } } });

      const basicTechnicalQuestionSeeds = [
        // Accounting
        {
          categoryId: accounting.id,
          difficulty: "basic",
          prompt: "Walk me through the three financial statements and how they link together.",
          modelAnswer:
            "The Income Statement shows revenue, expenses, and net income over a period. Net income flows into the Cash Flow Statement as the starting line of Cash from Operations, where it's adjusted for non-cash items like depreciation and changes in working capital. The ending cash balance from the Cash Flow Statement flows onto the Balance Sheet as the period's cash balance, and net income (less any dividends) flows into retained earnings within shareholders' equity, keeping the Balance Sheet balanced.",
        },
        {
          categoryId: accounting.id,
          difficulty: "basic",
          prompt: "If depreciation increases by $10, what happens to each of the three financial statements?",
          modelAnswer:
            "On the Income Statement, operating expenses rise by $10, so pre-tax income falls by $10; net income falls by $10 × (1 − tax rate). On the Cash Flow Statement, net income is down but depreciation is a non-cash add-back of $10, so cash from operations rises by $10 × tax rate. On the Balance Sheet, PP&E falls by $10, cash rises by the tax savings, and retained earnings falls by the net income decrease — assets and liabilities-plus-equity stay in balance.",
        },
        {
          categoryId: accounting.id,
          difficulty: "basic",
          prompt: "What's the difference between accounts receivable and deferred revenue?",
          modelAnswer:
            "Accounts receivable is revenue the company has already recognized on the income statement but hasn't collected cash for yet — it's an asset representing money owed to the company. Deferred revenue is the reverse: cash the company has already collected but hasn't yet earned or recognized as revenue, so it sits on the balance sheet as a liability until the company delivers the good or service.",
        },
        {
          categoryId: accounting.id,
          difficulty: "basic",
          prompt: "Why can a profitable company still run out of cash?",
          modelAnswer:
            "Net income includes non-cash items and accrual-based revenue and expense recognition that don't match actual cash movement — for example, revenue recognized but not yet collected, inventory purchased but not yet sold, or heavy capital expenditures and debt repayments that don't appear on the income statement. A company can show positive net income while its cash outflows leave it unable to meet near-term obligations.",
        },
        // Enterprise Value & Equity Value
        {
          categoryId: evEquityValue.id,
          difficulty: "basic",
          prompt: "What is Enterprise Value and what does it represent?",
          modelAnswer:
            "Enterprise Value represents the value of a company's core operating business, attributable to all capital providers — common shareholders, preferred shareholders, and debt holders. It's the theoretical price an acquirer would pay to buy the entire operating business, independent of how that business happens to be financed.",
        },
        {
          categoryId: evEquityValue.id,
          difficulty: "basic",
          prompt: "What is Equity Value and how is it calculated?",
          modelAnswer:
            "Equity Value is the portion of a company's value that belongs to common shareholders. For public companies it's current share price multiplied by fully diluted shares outstanding; in a transaction, it's the price paid for the equity of the business.",
        },
        {
          categoryId: evEquityValue.id,
          difficulty: "basic",
          prompt: "Walk me through the bridge from Enterprise Value to Equity Value.",
          modelAnswer:
            "Starting from Enterprise Value, subtract total debt and preferred stock, subtract minority interest, and add back cash and cash equivalents to arrive at Equity Value. Intuitively: an acquirer of the equity inherits the target's debt obligations (a cost) but also gains its cash (a benefit), so EV nets those out to isolate what's owed to common shareholders.",
        },
        {
          categoryId: evEquityValue.id,
          difficulty: "basic",
          prompt: "Why do we add minority interest when calculating Enterprise Value from Equity Value?",
          modelAnswer:
            "When a company consolidates a subsidiary it doesn't fully own, its financials — and the multiples built from them, like EBITDA — reflect 100% of that subsidiary's results, even though minority shareholders own part of it. Adding minority interest to Enterprise Value keeps the numerator consistent with the fact that consolidated EBITDA already includes 100% of the subsidiary's earnings.",
        },
        // Valuation (Comps & Precedent Transactions)
        {
          categoryId: valuation.id,
          difficulty: "basic",
          prompt: "What is Comparable Companies Analysis and how do you pick the peer set?",
          modelAnswer:
            "Comps values a company by looking at the trading multiples (e.g., EV/EBITDA, P/E) of similar publicly traded companies and applying that multiple to the target's own financials. You select peers based on similarity in industry, business model, size, growth profile, margins, and geography — the closer the match, the more defensible the multiple.",
        },
        {
          categoryId: valuation.id,
          difficulty: "basic",
          prompt:
            "What is Precedent Transactions Analysis, and how does its output typically compare to Comps?",
          modelAnswer:
            "Precedent Transactions values a company using multiples paid in past M&A deals for similar companies. It typically produces a higher valuation than Comps because acquisition prices include a control premium — the extra amount a buyer pays to gain full control of a company, which isn't reflected in day-to-day public trading prices.",
        },
        {
          categoryId: valuation.id,
          difficulty: "basic",
          prompt: "Name two common valuation multiples and when you'd use each.",
          modelAnswer:
            "EV/EBITDA is capital-structure neutral, so it's useful for comparing companies with different levels of debt. P/E (Equity Value / Net Income) is affected by capital structure since interest expense flows through net income, so it's more common for financial institutions or when comparing equity returns directly rather than operating performance.",
        },
        {
          categoryId: valuation.id,
          difficulty: "basic",
          prompt: "What is a control premium and why does it matter in precedent transactions?",
          modelAnswer:
            "A control premium is the extra amount an acquirer pays above the target's current trading price to gain control of the company and its decision-making. It matters because it's baked into precedent transaction multiples but not into public trading (comps) multiples, which is a key reason the two methodologies produce different valuation ranges.",
        },
        // DCF
        {
          categoryId: dcf.id,
          difficulty: "basic",
          prompt: "Walk me through how you'd build a DCF at a high level.",
          modelAnswer:
            "Project the company's unlevered free cash flows for an explicit forecast period (typically 5–10 years), discount each year's cash flow back to present value using the weighted average cost of capital (WACC), calculate a terminal value representing cash flows beyond the forecast period and discount that back too, then sum the present values of the explicit cash flows and the terminal value to arrive at Enterprise Value.",
        },
        {
          categoryId: dcf.id,
          difficulty: "basic",
          prompt: "What is the discount rate in a DCF and what does it represent?",
          modelAnswer:
            "The discount rate — typically the Weighted Average Cost of Capital (WACC) — represents the blended return required by all of a company's capital providers given the riskiness of its cash flows. It's used to convert future cash flows into their present-day equivalent, since a dollar received in the future is worth less than a dollar today.",
        },
        {
          categoryId: dcf.id,
          difficulty: "basic",
          prompt: "What is Terminal Value, and name the two common ways to calculate it.",
          modelAnswer:
            "Terminal Value captures the value of all cash flows beyond the explicit forecast period. The two common methods are the Gordon Growth (perpetuity growth) method, which assumes cash flows grow at a constant rate forever, and the Exit Multiple method, which applies a valuation multiple to the final projected year's financials based on comparable company or transaction multiples.",
        },
        {
          categoryId: dcf.id,
          difficulty: "basic",
          prompt:
            "Why do we discount unlevered free cash flow rather than levered free cash flow in a standard DCF?",
          modelAnswer:
            "Unlevered free cash flow excludes the effects of financing (interest expense, debt repayments), so it represents cash flow available to all capital providers. Discounting it at WACC — which blends the cost of both debt and equity — produces Enterprise Value, matching the capital-structure-neutral nature of the cash flows.",
        },
        // Merger Models
        {
          categoryId: mergerModels.id,
          difficulty: "basic",
          prompt: "What does it mean for a deal to be accretive or dilutive?",
          modelAnswer:
            "A deal is accretive if the acquirer's pro forma earnings per share (EPS) is higher after the deal than before, and dilutive if pro forma EPS is lower. It's a rough gauge of whether a deal appears to create or destroy per-share value in the near term, though it's not the same as whether the deal creates real economic value.",
        },
        {
          categoryId: mergerModels.id,
          difficulty: "basic",
          prompt: "What is the basic rule of thumb for accretion/dilution based on P/E multiples?",
          modelAnswer:
            "In an all-stock deal, if the acquirer's P/E multiple is higher than the target's, the deal is typically accretive, because the acquirer is 'buying' earnings more cheaply than the market values its own earnings. If the acquirer's P/E is lower than the target's, the deal is typically dilutive.",
        },
        {
          categoryId: mergerModels.id,
          difficulty: "basic",
          prompt: "What is goodwill, and when is it created in an M&A deal?",
          modelAnswer:
            "Goodwill is an intangible asset created when an acquirer pays more for a target than the fair value of its identifiable net assets. It represents the premium paid for things like brand, customer relationships, and expected synergies, and it sits on the acquirer's balance sheet after the deal closes.",
        },
        {
          categoryId: mergerModels.id,
          difficulty: "basic",
          prompt: "Why might an acquirer prefer to pay in stock rather than cash?",
          modelAnswer:
            "Paying in stock preserves the acquirer's cash and avoids taking on additional debt, and it shares some of the deal's risk with the target's former shareholders since they become owners of the combined company. It's often used when the acquirer's stock is highly valued or when it lacks sufficient cash or debt capacity to fund an all-cash deal.",
        },
        // LBO Models
        {
          categoryId: lboModels.id,
          difficulty: "basic",
          prompt: "What is a Leveraged Buyout, at a high level?",
          modelAnswer:
            "An LBO is the acquisition of a company using a significant amount of borrowed money to fund the purchase price, with the target company's own cash flows and assets typically used to service and pay down that debt over the holding period. The financial sponsor puts in a relatively small equity check and aims to generate outsized equity returns through leverage.",
        },
        {
          categoryId: lboModels.id,
          difficulty: "basic",
          prompt: "Why do private equity firms use leverage in a buyout?",
          modelAnswer:
            "Leverage reduces the amount of equity the sponsor needs to put in to fund a given purchase price, which magnifies equity returns if the deal performs well — the sponsor captures the full upside in enterprise value growth while only having risked a smaller equity investment.",
        },
        {
          categoryId: lboModels.id,
          difficulty: "basic",
          prompt: "What are the main value creation levers in an LBO?",
          modelAnswer:
            "The three main levers are: EBITDA growth (through revenue growth, margin improvement, or operational changes), multiple expansion (selling the company at a higher valuation multiple than it was purchased for), and debt paydown (using the company's cash flow to reduce debt over the holding period, which increases equity value at exit).",
        },
        {
          categoryId: lboModels.id,
          difficulty: "basic",
          prompt: "What makes a company a good LBO candidate?",
          modelAnswer:
            "Strong, stable, and predictable free cash flow to service debt; a low existing debt load with room to add leverage; a strong market position with defensible margins; limited ongoing capital expenditure needs; and identifiable opportunities to improve operations or grow the business under new ownership.",
        },
        // Brain Teasers
        {
          categoryId: brainTeasers.id,
          difficulty: "basic",
          prompt: "How would you estimate how many gas stations there are in the United States?",
          modelAnswer:
            "Talk through your reasoning out loud rather than trying to recall a memorized number. Start with the U.S. population, estimate cars per household and average fill-ups per month, estimate how many cars a typical gas station serves per day, and work backward to a station count. The interviewer is grading your structured, sanity-checked approach, not the precision of the final figure.",
        },
        {
          categoryId: brainTeasers.id,
          difficulty: "basic",
          prompt: "Why are manhole covers round?",
          modelAnswer:
            "A round cover can't fall through its own opening no matter how it's turned or tilted, because its diameter is constant in every direction — a square or rectangular cover could be rotated to align with the diagonal of the opening and fall through. It's also easier to roll for transport and doesn't need a particular orientation to be replaced.",
        },
        {
          categoryId: brainTeasers.id,
          difficulty: "basic",
          prompt: "You have a 3-liter jug and a 5-liter jug and unlimited water. How do you measure exactly 4 liters?",
          modelAnswer:
            "Fill the 5-liter jug completely, then pour it into the 3-liter jug until the 3-liter jug is full, leaving 2 liters in the 5-liter jug. Empty the 3-liter jug, pour the remaining 2 liters into it, then refill the 5-liter jug completely and top off the 3-liter jug (which needs 1 more liter) from it — leaving exactly 4 liters in the 5-liter jug.",
        },
        {
          categoryId: brainTeasers.id,
          difficulty: "basic",
          prompt: "What is the interviewer actually testing with a brain teaser like this?",
          modelAnswer:
            "Brain teasers aren't really about the puzzle — they're testing whether you can stay calm under pressure, think out loud in a structured way, and work through an unfamiliar problem logically rather than guessing or freezing. A clear, step-by-step approach that lands on a reasonable answer matters more than speed or getting the 'trick' immediately.",
        },
      ];

      const advancedTechnicalQuestionSeeds = [
        // Accounting
        {
          categoryId: accounting.id,
          difficulty: "advanced",
          prompt: "Walk me through how a $100 write-down of inventory flows through the three statements.",
          modelAnswer:
            "On the Income Statement, the write-down hits COGS or a separate impairment line, reducing pre-tax income by $100 and net income by $100 × (1 − tax rate). On the Cash Flow Statement, net income is down, but the write-down is a non-cash charge so it's added back in full; cash from operations effectively rises by the associated tax benefit. On the Balance Sheet, inventory falls by $100, cash rises by the tax savings, and retained earnings falls by the net income decrease.",
        },
        {
          categoryId: accounting.id,
          difficulty: "advanced",
          prompt:
            "What's the difference between an operating lease and a finance (capital) lease under current accounting standards, and how does each show up on the balance sheet?",
          modelAnswer:
            "Under ASC 842 / IFRS 16, both operating and finance leases now put a right-of-use asset and a corresponding lease liability on the balance sheet. The distinction mainly shows up on the income statement and cash flow statement: a finance lease splits the expense into interest (declining over time) and amortization of the ROU asset, similar to debt, while an operating lease recognizes a single straight-line lease expense with the related cash outflow classified as operating rather than partly financing.",
        },
        {
          categoryId: accounting.id,
          difficulty: "advanced",
          prompt:
            "A company changes from FIFO to LIFO inventory accounting in a period of rising prices. What happens to COGS, net income, and taxes?",
          modelAnswer:
            "Under LIFO, the most recently purchased, higher-cost inventory is expensed first, so COGS rises relative to FIFO. Higher COGS means lower reported pre-tax income and net income, but also a lower tax bill since taxable income falls too. On the balance sheet, ending inventory is valued at older, lower costs under LIFO, understating inventory relative to current replacement cost — a 'LIFO reserve' bridges the two.",
        },
        {
          categoryId: accounting.id,
          difficulty: "advanced",
          prompt:
            "Why does an increase in Deferred Tax Liabilities typically appear as a source of cash on the Cash Flow Statement?",
          modelAnswer:
            "A deferred tax liability arises when a company's book tax expense (per GAAP) is higher than its actual cash taxes paid, commonly from accelerated tax depreciation versus straight-line book depreciation. Since the income statement already deducted the higher book tax expense but less cash actually left the business, the increase in the DTL is added back on the cash flow statement to reconcile net income to actual cash taxes paid.",
        },
        // Enterprise Value & Equity Value
        {
          categoryId: evEquityValue.id,
          difficulty: "advanced",
          prompt:
            "How do you treat operating leases when calculating Enterprise Value, and has this changed with new lease accounting standards?",
          modelAnswer:
            "Historically, analysts added the present value of off-balance-sheet operating lease commitments to EV, treating them as debt-like. Under ASC 842/IFRS 16, operating lease liabilities are now on the balance sheet, so many practitioners now include the recognized lease liability directly in the debt bridge rather than making a separate off-balance-sheet adjustment — though conventions vary by firm and EBITDA definitions still need to be checked for consistency.",
        },
        {
          categoryId: evEquityValue.id,
          difficulty: "advanced",
          prompt: "How should you treat convertible debt when calculating diluted Equity Value?",
          modelAnswer:
            "Use the treasury stock or if-converted method depending on whether the conversion is in-the-money: if the current share price exceeds the conversion price, treat the debt as converted into shares (increasing share count) and typically remove the associated debt and interest expense; if it's out-of-the-money, treat it as straight debt in the EV-to-equity bridge instead.",
        },
        {
          categoryId: evEquityValue.id,
          difficulty: "advanced",
          prompt:
            "Why might Enterprise Value be a more appropriate basis for comparison than Equity Value when comparing two companies with very different capital structures?",
          modelAnswer:
            "Equity Value and equity-based multiples like P/E are affected by financial leverage since interest expense flows through net income. Enterprise Value and EV-based multiples like EV/EBITDA capture the value of the whole operating business before financing decisions, so they let you compare operating performance across companies independent of how conservatively or aggressively each is financed.",
        },
        {
          categoryId: evEquityValue.id,
          difficulty: "advanced",
          prompt:
            "A company has significant net operating losses (NOLs). How does that affect valuation more broadly, even though NOLs aren't a line item in the standard EV-to-equity bridge?",
          modelAnswer:
            "NOLs create real value by shielding future taxable income, which increases future free cash flow — and therefore both DCF value and, in an M&A context, the value an acquirer can realize — since less cash is paid in taxes until the NOLs are exhausted, subject to any limitations on their use after a change of control.",
        },
        // Valuation (Comps & Precedent Transactions)
        {
          categoryId: valuation.id,
          difficulty: "advanced",
          prompt:
            "Two companies have similar EV/EBITDA multiples, but one trades at a much higher EV/EBIT multiple than the other. What does that suggest?",
          modelAnswer:
            "A large gap between the EV/EBITDA and EV/EBIT multiples implies the company has relatively high depreciation and amortization compared to its peer — often because it's more capital-intensive or has recently made large acquisitions creating amortizable intangibles. It's a signal to look more closely at capex intensity and asset composition before relying on EBITDA-based multiples alone.",
        },
        {
          categoryId: valuation.id,
          difficulty: "advanced",
          prompt:
            "How do you handle a peer company in your comps set that has a one-time, non-recurring gain or loss in its most recent financials?",
          modelAnswer:
            "Normalize the peer's financials by adjusting net income and EBITDA to remove the one-time item before calculating its multiples, so the peer's trading multiple reflects its ongoing operating performance rather than being distorted by a transitory event. Using the unadjusted, as-reported multiple would understate or overstate the peer's 'true' valuation multiple and skew the range you apply to your target.",
        },
        {
          categoryId: valuation.id,
          difficulty: "advanced",
          prompt:
            "Why might you choose calendarized (fiscal-year-aligned) multiples instead of using each company's reported fiscal year figures as-is in a comps analysis?",
          modelAnswer:
            "If peer companies have different fiscal year ends, comparing their multiples as-reported mixes different time periods and can distort the comparison, especially in a business with seasonality or a changing macro environment. Calendarizing — adjusting each company's financials to a common period, like trailing twelve months as of the same date — makes the peer set more directly comparable.",
        },
        {
          categoryId: valuation.id,
          difficulty: "advanced",
          prompt:
            "In precedent transactions, why do you typically exclude synergy-driven premiums when applying the resulting multiple to your own target?",
          modelAnswer:
            "A precedent deal's price can reflect synergies specific to that particular acquirer and target — cost savings or revenue upside unique to that combination — which may not be replicable for a different buyer or in your standalone valuation. Applying the raw synergy-inflated multiple to your target without adjustment can overstate its standalone value, so analysts often flag or discount transactions with unusually high strategic premiums.",
        },
        // DCF
        {
          categoryId: dcf.id,
          difficulty: "advanced",
          prompt:
            "How do you calculate WACC, and what's the intuition behind weighting by market value rather than book value of debt and equity?",
          modelAnswer:
            "WACC = (E / (D + E)) × Cost of Equity + (D / (D + E)) × Cost of Debt × (1 − tax rate), where E and D are market values. You weight by market value because WACC represents the return investors currently require given the company's true capital structure at market prices — book values, especially of equity, can be stale accounting figures that don't reflect what the company would actually have to pay to raise capital today.",
        },
        {
          categoryId: dcf.id,
          difficulty: "advanced",
          prompt:
            "How would you estimate a company's cost of equity using CAPM, and what does beta represent?",
          modelAnswer:
            "CAPM: Cost of Equity = Risk-Free Rate + Beta × Equity Risk Premium. Beta measures the stock's sensitivity to overall market movements — a beta above 1 means the stock is more volatile than the market and therefore riskier, requiring a higher expected return. For private companies or divisions, you typically 'unlever' comparable public companies' betas to strip out their capital structure, then 're-lever' at your target's own debt-to-equity ratio.",
        },
        {
          categoryId: dcf.id,
          difficulty: "advanced",
          prompt:
            "Your DCF is highly sensitive to the terminal value assumption. How do you sanity-check a Gordon Growth terminal value?",
          modelAnswer:
            "Cross-check the implied exit multiple: back into the implied EV/EBITDA (or similar) multiple that the Gordon Growth terminal value represents in the final forecast year, and compare it to where similar companies actually trade or have been acquired. If the implied multiple is far outside a reasonable range, it signals the perpetuity growth rate or discount rate assumptions need revisiting.",
        },
        {
          categoryId: dcf.id,
          difficulty: "advanced",
          prompt:
            "Why would you build a sensitivity table in a DCF, and what are the two variables most commonly sensitized?",
          modelAnswer:
            "A DCF's output is highly sensitive to a handful of assumptions that are inherently uncertain, so a sensitivity table shows how the implied valuation changes across a range of inputs rather than presenting a single point estimate as false precision. The two most commonly sensitized variables are the discount rate (WACC) and the terminal growth rate (or exit multiple), since small changes in either can meaningfully swing the valuation.",
        },
        // Merger Models
        {
          categoryId: mergerModels.id,
          difficulty: "advanced",
          prompt:
            "Walk me through how you'd calculate the exchange ratio in an all-stock deal, and what happens to it if the target demands a fixed value instead of a fixed exchange ratio.",
          modelAnswer:
            "In a fixed exchange ratio deal, the target receives a set number of acquirer shares per target share regardless of price movements before closing, so the deal value fluctuates with the acquirer's stock price. In a fixed value deal, the exchange ratio instead floats — adjusting as the acquirer's stock price moves — so the target receives a set dollar amount of stock; this shifts pre-closing market risk from the target's shareholders onto the acquirer, since the acquirer must issue more shares if its price falls.",
        },
        {
          categoryId: mergerModels.id,
          difficulty: "advanced",
          prompt:
            "What are synergies in an M&A context, and why do analysts typically apply a haircut or phase them in gradually rather than assuming them immediately and in full?",
          modelAnswer:
            "Synergies are the incremental cost savings or revenue benefits expected from combining two companies — e.g., eliminating duplicate overhead or cross-selling products. Analysts discount or phase them in because synergies are notoriously difficult to fully realize, take time to execute, and overly optimistic synergy assumptions are a common way accretion/dilution and returns analyses get overstated.",
        },
        {
          categoryId: mergerModels.id,
          difficulty: "advanced",
          prompt:
            "How does the treatment of transaction and financing fees typically differ between a strategic acquirer and a financial sponsor in a merger model?",
          modelAnswer:
            "Both typically expense advisory and legal fees as incurred, while financing fees on new debt are usually capitalized and amortized over the life of the debt. The bigger difference is scale and sensitivity: a financial sponsor's returns are highly levered and fee-sensitive since it's judged on IRR and equity multiple, whereas a strategic acquirer folds fees into a broader accretion/dilution and strategic-rationale analysis.",
        },
        {
          categoryId: mergerModels.id,
          difficulty: "advanced",
          prompt: "Why might a deal be EPS-accretive in year one but still be a value-destroying acquisition?",
          modelAnswer:
            "Near-term EPS accretion can be driven mechanically by financing structure — for example, cheap debt or a high acquirer P/E relative to the target — rather than by the deal actually creating economic value. A deal can boost EPS while destroying value if the acquirer overpays relative to the target's true cash-flow-generating potential, if promised synergies don't materialize, or if the added leverage increases risk beyond what the earnings bump compensates for.",
        },
        // LBO Models
        {
          categoryId: lboModels.id,
          difficulty: "advanced",
          prompt:
            "Walk me through how you'd calculate IRR and MOIC for a sponsor's equity in an LBO, and how they can tell different stories about the same deal.",
          modelAnswer:
            "MOIC is simply the equity value at exit divided by the equity invested at entry, ignoring the holding period. IRR is the annualized return that equates that same cash flow stream to zero net present value, so it's heavily influenced by how long the investment is held — a deal held for 3 years to reach a given MOIC will show a much higher IRR than the same MOIC achieved over 7 years. Sponsors care about both because a fast, modest-multiple exit can be a great IRR outcome but a mediocre absolute dollar return, and vice versa.",
        },
        {
          categoryId: lboModels.id,
          difficulty: "advanced",
          prompt: "What is a dividend recapitalization, and how does it affect sponsor returns?",
          modelAnswer:
            "A dividend recap has the portfolio company raise new debt and pay the proceeds out to the sponsor as a dividend before the eventual exit, letting the sponsor recover part of its invested capital early without selling the company. This boosts IRR since cash comes back sooner and reduces the sponsor's remaining capital at risk, but it increases the company's leverage and interest burden, which can reduce equity value at the eventual exit if not managed carefully.",
        },
        {
          categoryId: lboModels.id,
          difficulty: "advanced",
          prompt:
            "How do management rollover and management incentive plans (option pools) typically affect an LBO's sources and uses and the sponsor's ultimate returns?",
          modelAnswer:
            "Management rollover reduces the amount of new cash the sponsor needs to contribute, since management reinvests a portion of their existing proceeds as equity in the new entity, and it aligns incentives by keeping management with meaningful skin in the game. A management incentive plan sets aside a slice of the equity upside for management, which dilutes the sponsor's own returns but is generally viewed as worthwhile because it drives performance that grows the total pie.",
        },
        {
          categoryId: lboModels.id,
          difficulty: "advanced",
          prompt:
            "In an LBO with multiple tranches of debt (e.g., senior secured, subordinated/mezzanine), how does the capital structure affect the sponsor's risk and return profile?",
          modelAnswer:
            "Senior secured debt is cheapest and gets repaid first in a downside scenario, so it carries the lowest risk and lowest return; subordinated or mezzanine debt sits behind it, is more expensive, and often carries equity-like features to compensate lenders for greater risk. Layering in more subordinated debt increases overall leverage and the equity cushion's sensitivity to performance — it can boost sponsor IRR in an upside case but meaningfully increases the risk of a low or negative return if the company underperforms.",
        },
        // Brain Teasers
        {
          categoryId: brainTeasers.id,
          difficulty: "advanced",
          prompt:
            "A jar contains 1,000 coins. All but one are fair coins; one is double-headed. You pick a random coin and flip it 5 times, getting heads every time. What's the probability the coin you picked is the double-headed one?",
          modelAnswer:
            "Use Bayes' theorem. The prior probability of picking the double-headed coin is 1/1000, and if it's double-headed, P(5 heads) = 1. For a fair coin (999/1000 prior), P(5 heads) = 1/32. Posterior = (1/1000 × 1) / [(1/1000 × 1) + (999/1000 × 1/32)] ≈ 3%. The point is to walk through the Bayesian update explicitly rather than guess — interviewers want to see the structured math, not just a final number.",
        },
        {
          categoryId: brainTeasers.id,
          difficulty: "advanced",
          prompt:
            "You're offered a game: flip a fair coin repeatedly; you win $2^n if it first lands heads on the nth flip. What would you pay to play (the St. Petersburg Paradox), and how do you reason about it out loud?",
          modelAnswer:
            "The naive expected value is infinite, yet almost no one would pay a huge amount to play. The right approach in an interview is to name the paradox, then reason about why: real-world constraints like the house's finite bankroll, risk aversion, and diminishing marginal utility of money mean a rational person would only pay a modest, bounded amount — walking through this tension matters more than landing on one 'correct' price.",
        },
        {
          categoryId: brainTeasers.id,
          difficulty: "advanced",
          prompt:
            "How would you estimate the number of piano tuners in Chicago, and what's the key structural difference between this and a simpler estimation question?",
          modelAnswer:
            "Break it into a chain of estimates: Chicago's population, households with pianos, pianos per household, how often a piano is tuned per year, how long a tuning takes, and how many tunings a full-time tuner can do per year — then divide total annual tunings needed by tunings per tuner. The key difference from a simpler estimate is the number of multiplicative steps: each assumption compounds error, so the interviewer is testing whether you sanity-check intermediate numbers rather than just chaining guesses together.",
        },
      ];

      for (const q of [...basicTechnicalQuestionSeeds, ...advancedTechnicalQuestionSeeds]) {
        await prisma.question.create({ data: q });
      }
    } else {
      const valuationBasics = await upsertCategory(
        track.id,
        "valuation-basics",
        "Valuation Basics",
        technicalParent.id
      );

      await prisma.question.deleteMany({ where: { categoryId: valuationBasics.id } });

      const questionSeeds = [
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
