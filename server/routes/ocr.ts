import { RequestHandler } from "express";
import type { OCRRequest, OCRResponse } from "@shared/api";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ["zomato", "swiggy", "pizza", "burger", "restaurant", "dominos", "cafe", "coffee", "food", "lunch", "dinner", "breakfast", "snack"],
  Transport: ["uber", "ola", "cab", "metro", "bus", "fuel", "petrol", "diesel", "taxi", "auto", "train", "flight"],
  Shopping: ["amazon", "flipkart", "myntra", "ajio", "store", "shop", "mall", "retail", "clothing", "apparel", "grocery"],
  Bills: ["electricity", "power", "water", "rent", "internet", "wifi", "broadband", "bill", "utility", "mobile", "phone"],
  Subscriptions: ["netflix", "spotify", "youtube", "prime", "subscription", "streaming", "membership"],
  Health: ["pharmacy", "med", "doctor", "clinic", "hospital", "health", "drug", "medicine", "dental", "hospital"],
};

function guessCategory(text: string): OCRResponse["category"] {
  const lower = text.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((k) => lower.includes(k))) return cat as OCRResponse["category"];
  }
  return "Other";
}

function extractDate(text: string): string {
  const datePatterns = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/,
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
    /(\d{1,2})-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*-(\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = match[0];
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      } catch {}
    }
  }

  return new Date().toISOString();
}

export const handleOCR: RequestHandler = (req, res) => {
  const body = req.body as OCRRequest;
  const fullText = (body.text || body.name || "").replace(/\s+/g, " ");
  const base = fullText.toLowerCase();

  // Extract merchant/description from text
  let description = "Receipt";
  const merchantPatterns = [
    /(?:merchant|store|shop|vendor|from):\s*([^\n,;]+)/i,
    /^([A-Z][A-Za-z0-9\s&'-]+?)(?:\s+[0-9]+|$)/m,
    /([a-z0-9\s&'-]+?)(?:\s*(?:₹|rs|inr|amount)\s*[0-9])/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      description = match[1].trim().slice(0, 50);
      break;
    }
  }

  // Strategy 1: Look for "Total" keyword followed by amount (highest priority)
  let amount = 0;

  // More comprehensive patterns for amounts near "Total" keywords
  const totalKeywordRegex = /(?:grand\s+total|total\s+(?:amount|due)?|payable|amount\s+due|balance\s+due|net\s+(?:amount|total)|final\s+amount)\s*[:\s]*(?:₹|rs\.?|inr)?\s*([0-9,]+\.?[0-9]*)/gi;

  let match;
  const totalMatches: number[] = [];
  while ((match = totalKeywordRegex.exec(base)) !== null) {
    const raw = match[1].replace(/,/g, "");
    const val = parseFloat(raw);
    if (isFinite(val) && val > 10 && val < 999999) {
      totalMatches.push(val);
    }
  }

  // Use the largest amount found near "total" keywords
  if (totalMatches.length > 0) {
    amount = Math.max(...totalMatches);
  }

  // Strategy 2: If no total found, collect all amounts with intelligent weighting
  if (!amount) {
    const candidates: { value: number; weight: number; idx: number }[] = [];

    // Comprehensive number pattern: handles 714.55, 714, 7,14.55, 32.45, etc.
    const numberRegex = /(₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+\.[0-9]{1,2}|[0-9]{3,})/gi;

    let m: RegExpExecArray | null;
    while ((m = numberRegex.exec(base))) {
      const raw = m[2].replace(/,/g, "");
      const val = parseFloat(raw);
      if (!isFinite(val) || val < 10) continue;

      let weight = 1;

      // Currency marker is strong indicator
      if (m[1]) weight += 5;

      // Check context around the number
      const windowStart = Math.max(0, m.index - 100);
      const windowEnd = Math.min(base.length, m.index + (m[0]?.length || 0) + 30);
      const window = base.slice(windowStart, windowEnd);

      // Strong indicators for final amount
      if (/\btotal\b|\bgrand\s*total\b/.test(window)) weight += 100;
      if (/\bpayable\b|\bamount\s*due\b|\bbalance\s*due\b|\bnet\s*amount\b|\bnet\s*total\b/.test(window)) weight += 80;
      if (/\bsubtotal\b|\bsub\s*total\b/.test(window)) weight += 30;
      if (/\bfinal\s*amount\b|\bfinal\s*total\b/.test(window)) weight += 90;

      // Penalty if it looks like a line item or component
      const beforeText = base.slice(Math.max(0, m.index - 200), m.index);
      if (/qty|quantity|x\s+\d|price|cost|rate|unit|per\s|discount|tax|shipping|delivery|charges/.test(beforeText)) {
        weight *= 0.3;
      }

      // Prefer larger values (final totals are usually larger than components)
      if (val >= 100) weight += Math.log10(val) * 2;
      if (val >= 1000) weight += 10;

      candidates.push({ value: val, weight, idx: m.index });
    }

    // Sort by weight and value
    if (candidates.length) {
      candidates.sort((a, b) => {
        // Primary: weight
        if (b.weight !== a.weight) return b.weight - a.weight;
        // Secondary: larger values (assuming final amount > line items)
        return b.value - a.value;
      });
      amount = candidates[0].value;
    }
  }

  // Strategy 3: Fallback - find largest 3-digit+ number that looks like an amount
  if (!amount) {
    const allNumbers = fullText.match(/\d{3,}/g);
    if (allNumbers) {
      const nums = allNumbers
        .map(n => parseFloat(n))
        .filter(n => isFinite(n) && n >= 50 && n <= 9999999)
        .sort((a, b) => b - a);

      // Prefer numbers in a reasonable transaction range (50 to 999999)
      amount = nums.find(n => n <= 999999) || nums[0] || 500;
    }
  }

  if (!amount) amount = 500;

  const category = guessCategory(fullText);
  const date = extractDate(fullText);

  const response: OCRResponse = {
    amount,
    date,
    description: description || "Receipt",
    category,
  };
  res.json(response);
};
