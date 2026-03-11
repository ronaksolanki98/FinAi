import { RequestHandler } from "express";
import type { InsightsRequest, InsightsResponse, CategoryKey } from "@shared/api";

export const handleInsights: RequestHandler = (req, res) => {
  const body = req.body as InsightsRequest;
  const tips: string[] = [];

  if (body && body.transactions?.length) {
    const categoryTotals = getCategoryTotals(body.transactions);
    const totalSpend = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    // Highest spending category
    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];
    if (topCategory && topCategory[1] > 0) {
      const categoryName = topCategory[0];
      const amount = topCategory[1];
      const percentage = ((amount / totalSpend) * 100).toFixed(0);
      tips.push(`${categoryName} is your highest spending category at ${percentage}% of total (₹${amount.toFixed(0)}). Review these expenses for savings.`);
    }

    // Subscriptions insight
    const subs = categoryTotals.Subscriptions || 0;
    if (subs > 500) {
      tips.push(`You spent ₹${subs.toFixed(0)} on subscriptions. Consider auditing unused services to save money.`);
    }

    // Food spending insight
    const food = categoryTotals.Food || 0;
    const foodBudget = body.budgets?.Food ?? 4000;
    if (food > 0) {
      const foodPercent = ((food / foodBudget) * 100).toFixed(0);
      if (food > foodBudget * 0.75) {
        tips.push(`Your food spending (₹${food.toFixed(0)}) is ${foodPercent}% of your budget. Consider meal planning to stay within limits.`);
      } else if (food > 0) {
        tips.push(`Food spending: ₹${food.toFixed(0)} out of ₹${foodBudget} budget. You're on track!`);
      }
    }

    // Shopping insight
    const shopping = categoryTotals.Shopping || 0;
    if (shopping > foodBudget * 0.5) {
      tips.push(`Shopping expenses (₹${shopping.toFixed(0)}) are significant. Consider distinguishing needs vs. wants.`);
    }

    // Transport insight
    const transport = categoryTotals.Transport || 0;
    if (transport > 1000) {
      tips.push(`Transport costs are ₹${transport.toFixed(0)}. Explore carpooling or public transit options.`);
    }

    // Late‑paying client heuristic
    const unpaid = body.transactions.find((t) => t.client && t.paid === false);
    if (unpaid) {
      tips.push(`${unpaid.client} has unpaid invoices. Follow up to improve cash flow.`);
    }

    // Multiple transactions in short period
    if (body.transactions.length > 10) {
      tips.push(`You've made ${body.transactions.length} transactions. Track recurring expenses to find subscription opportunities.`);
    }
  }

  const response: InsightsResponse = { tips };
  res.json(response);
};

function getCategoryTotals(transactions: any[]): Record<string, number> {
  const totals: Record<string, number> = {
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
      totals[t.category] += t.amount;
    }
  }

  return totals;
}

function sumBy<T>(arr: T[], fn: (t: T) => number) {
  return arr.reduce((a, b) => a + fn(b), 0);
}
