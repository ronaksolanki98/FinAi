import { RequestHandler } from "express";
import type { InsightsRequest, InsightsResponse, CategoryKey } from "@shared/api";

const DEFAULT_BUDGETS: Record<CategoryKey, number> = {
  Food: 4000,
  Transport: 2500,
  Shopping: 5000,
  Bills: 3000,
  Subscriptions: 1500,
  Health: 2000,
  Other: 1000,
};

export const handleInsights: RequestHandler = (req, res) => {
  const body = req.body as InsightsRequest;
  const tips: string[] = [];
  if (!body || !body.transactions?.length) {
    return res.json({ tips });
  }

  const categoryTotals = getCategoryTotals(body.transactions);
  const totalSpend = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const txCount = body.transactions.length;
  const budgets = { ...DEFAULT_BUDGETS, ...(body.budgets || {}) };
  const avgTx = totalSpend / txCount;

  const [topCategory, secondCategory] = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  if (topCategory && totalSpend > 0) {
    const [categoryName, amount] = topCategory;
    const percentage = ((amount / totalSpend) * 100).toFixed(0);
    tips.push(`Your heaviest category is ${categoryName} (₹${amount.toFixed(0)}), which makes up ${percentage}% of your ₹${totalSpend.toFixed(0)} spending this period.`);
  }

  if (secondCategory) {
    const [categoryName, amount] = secondCategory;
    tips.push(`Next highest bucket is ${categoryName} with ₹${amount.toFixed(0)} in spending—see if any of it was discretionary.`);
  }

  if (avgTx > 2000) {
    tips.push(`Average transaction size is ₹${avgTx.toFixed(0)}, which is quite high. Look for large one-off charges to trim or spread out.`);
  } else {
    tips.push(`Average transaction size is ₹${avgTx.toFixed(0)}, so you’re managing frequent smaller expenses—stay on top of recurring bills.`);
  }

  const overspent = (Object.keys(categoryTotals) as CategoryKey[]).filter((cat) => {
    const limit = budgets[cat] ?? DEFAULT_BUDGETS[cat];
    return limit && categoryTotals[cat] > limit;
  });

  if (overspent.length) {
    overspent.forEach((cat) => {
      const overBy = categoryTotals[cat] - budgets[cat];
      const percentage = ((categoryTotals[cat] / (budgets[cat] || 1)) * 100).toFixed(0);
      tips.push(
        `${cat} is currently ₹${overBy.toFixed(0)} over its budget (${percentage}% of assigned limit). Pause discretionary buys in this bucket until the next cycle.`
      );
    });
  } else {
    tips.push("No budget is currently overrun—use this discipline to add a small savings target.");
  }

  // Detect spending spikes / large single charges
  const largeTxn = body.transactions.find((t) => t.amount > avgTx * 2);
  if (largeTxn) {
    tips.push(`Big spend alert: ₹${largeTxn.amount.toFixed(0)} on ${largeTxn.category}. Check if it was planned or can be split.`);
  }

  const subsCount = body.transactions.filter((t) => t.category === "Subscriptions").length;
  const subsSpend = categoryTotals.Subscriptions || 0;
  if (subsCount >= 2 && subsSpend > budgets.Subscriptions * 0.8) {
    tips.push(`You have ${subsCount} subscription charges totaling ₹${subsSpend.toFixed(0)}—cancel unused ones to free up ₹${(budgets.Subscriptions - subsSpend).toFixed(0)} in budget.`);
  }

  const dayBuckets: Record<string, number> = {};
  for (const tx of body.transactions) {
    const day = new Date(tx.date || Date.now()).toLocaleDateString(undefined, { weekday: "short" });
    dayBuckets[day] = (dayBuckets[day] || 0) + 1;
  }
  const busiestDay = Object.entries(dayBuckets).sort(([, a], [, b]) => b - a)[0];
  if (busiestDay) {
    tips.push(`Most of your transactions happen on ${busiestDay[0]} (${busiestDay[1]} entries). Schedule spending-free days to balance the week.`);
  }

  const response: InsightsResponse = { tips };
  res.json(response);
};

function getCategoryTotals(transactions: any[]): Record<CategoryKey, number> {
  const totals: Record<CategoryKey, number> = {
    Food: 0,
    Transport: 0,
    Shopping: 0,
    Bills: 0,
    Subscriptions: 0,
    Health: 0,
    Other: 0,
  };

  for (const t of transactions) {
    if (t.category in totals) {
      totals[t.category as CategoryKey] += t.amount;
    }
  }

  return totals;
}
