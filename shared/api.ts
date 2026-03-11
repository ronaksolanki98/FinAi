/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export type CategoryKey = "Food" | "Transport" | "Shopping" | "Bills" | "Subscriptions" | "Health" | "Other";

export interface Transaction {
  id: string;
  date: string; // ISO
  description: string;
  amount: number;
  category: CategoryKey;
  client?: string;
  paid?: boolean;
}

export interface OCRRequest {
  name?: string;
  text?: string; // extracted text if available (from PDF/parsed text)
  region?: "IN" | "US" | "EU" | "OTHER"; // influence currency parsing
}

export interface OCRResponse {
  amount: number;
  date: string; // ISO
  description: string;
  category: CategoryKey;
}

export interface InsightsRequest {
  transactions: Transaction[];
  budgets: Record<CategoryKey, number>;
}

export interface InsightsResponse {
  tips: string[];
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
