import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ListChecks, Loader } from "lucide-react";
import type { Transaction, CategoryKey, InsightsResponse } from "@shared/api";
import { useUserData } from "@/hooks/use-user-data";

export default function InsightsPage() {
  const userDataHook = useUserData();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Record<CategoryKey, number>>({});
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoryExamples = [
    { description: '"Zomato - Paneer Tikka"', category: "Food & Dining" },
    { description: '"Uber to Airport"', category: "Transport" },
    { description: '"Netflix Subscription"', category: "Subscriptions" },
    { description: '"Torrent Power"', category: "Bills" },
  ];

  // Load data on mount and whenever page is visited
  useEffect(() => {
    const loadData = () => {
      const savedTransactions = userDataHook.getTransactions();
      const savedBudgets = userDataHook.getBudgets();
      setTransactions(savedTransactions);
      setBudgets(savedBudgets);
    };

    loadData();

    // Reload data when page becomes visible (user navigates back to this page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Generate insights when transactions or budgets change
  useEffect(() => {
    async function generateInsights() {
      setIsLoading(true);
      try {
        const resp = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions, budgets }),
        });
        const data = (await resp.json()) as InsightsResponse;
        setInsights(data.tips);
      } catch (error) {
        console.error("Failed to generate insights:", error);
        setInsights([]);
      } finally {
        setIsLoading(false);
      }
    }

    generateInsights();
  }, [transactions, budgets]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">AI categorization & insights</h1>
        <p className="text-muted-foreground">Automatic NLP categorization and personalized savings tips.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5"/> Categorization examples</CardTitle>
            <CardDescription>How FinAi understands your transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {categoryExamples.map((example, idx) => (
                <li key={idx}>
                  <span className="font-medium">{example.description}</span> → {example.category}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5"/> AI insights</CardTitle>
            <CardDescription>Actionable suggestions to save more</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Analyzing your expenses...
              </div>
            ) : insights.length > 0 ? (
              insights.map((tip, idx) => (
                <div key={idx} className="rounded-lg border bg-secondary p-3">
                  {tip}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground py-4 text-center">
                No tips yet — upload a receipt to generate insights.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
