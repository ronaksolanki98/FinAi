import { useEmailAuth } from "./use-email-auth";
import type { Transaction, CategoryKey } from "@shared/api";

const defaultBudgets: Record<CategoryKey, number> = {
  Food: 4000,
  Transport: 2500,
  Shopping: 5000,
  Bills: 3000,
  Subscriptions: 1500,
  Health: 2000,
  Other: 1000,
};

export function useUserData() {
  const { user } = useEmailAuth();
  
  if (!user) {
    throw new Error("useUserData must be used within authenticated context");
  }

  const getStorageKey = (key: string) => `user_${user.id}_${key}`;

  const getTransactions = (): Transaction[] => {
    const stored = localStorage.getItem(getStorageKey("transactions"));
    return stored ? JSON.parse(stored) : [];
  };

  const setTransactions = (transactions: Transaction[]) => {
    localStorage.setItem(getStorageKey("transactions"), JSON.stringify(transactions));
  };

  const addTransaction = (transaction: Transaction) => {
    const transactions = getTransactions();
    transactions.unshift(transaction);
    setTransactions(transactions);
    return transaction;
  };

  const deleteTransaction = (id: string) => {
    const transactions = getTransactions().filter(t => t.id !== id);
    setTransactions(transactions);
  };

  const getBudgets = (): Record<CategoryKey, number> => {
    const stored = localStorage.getItem(getStorageKey("budgets"));
    return stored ? JSON.parse(stored) : defaultBudgets;
  };

  const setBudgets = (budgets: Record<CategoryKey, number>) => {
    localStorage.setItem(getStorageKey("budgets"), JSON.stringify(budgets));
  };

  return {
    getTransactions,
    setTransactions,
    addTransaction,
    deleteTransaction,
    getBudgets,
    setBudgets,
  };
}
