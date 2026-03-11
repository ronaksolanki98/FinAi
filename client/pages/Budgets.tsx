import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { CategoryKey } from "@shared/api";
import { useUserData } from "@/hooks/use-user-data";

const categoryColors: Record<CategoryKey, string> = {
  Food: "#8b5cf6",
  Transport: "#06b6d4",
  Shopping: "#f97316",
  Bills: "#22c55e",
  Subscriptions: "#a855f7",
  Health: "#ef4444",
  Other: "#64748b",
};

const categories: CategoryKey[] = ["Food", "Transport", "Shopping", "Bills", "Subscriptions", "Health", "Other"];

export default function BudgetsPage() {
  const userDataHook = useUserData();
  const [budgets, setBudgets] = useState<Record<CategoryKey, number>>({} as Record<CategoryKey, number>);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryKey | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const savedBudgets = userDataHook.getBudgets();
    const savedTransactions = userDataHook.getTransactions();
    setBudgets(savedBudgets);
    setTransactions(savedTransactions);
  }, []);

  // Calculate used amount for each category this month
  const getUsedAmount = (category: CategoryKey) => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.category === category && tDate >= monthStart && tDate <= monthEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const startEdit = (category: CategoryKey) => {
    setEditingCategory(category);
    setEditValue(budgets[category].toString());
  };

  const saveEdit = (category: CategoryKey) => {
    const newAmount = parseFloat(editValue);
    if (isNaN(newAmount) || newAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const updatedBudgets = { ...budgets, [category]: newAmount };
    setBudgets(updatedBudgets);
    userDataHook.setBudgets(updatedBudgets);
    setEditingCategory(null);
    toast.success(`${category} budget updated to ₹${newAmount}`);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValue("");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Budgets & alerts</h1>
        <p className="text-muted-foreground">Set limits by category and get proactive warnings when you overspend.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5"/> This month</CardTitle>
          <CardDescription>Usage and remaining amounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {categories.map((category) => {
            const used = getUsedAmount(category);
            const limit = budgets[category] || 1000;
            const pct = Math.min(100, Math.round((used / limit) * 100));
            const over = used > limit;
            const color = categoryColors[category];

            if (editingCategory === category) {
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm" style={{ color }}>{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 h-8"
                        placeholder="0"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => saveEdit(category)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium" style={{ color }}>{category}</span>
                  <div className="flex items-center gap-2">
                    <span className={over ? "text-destructive" : "text-muted-foreground"}>
                      {`₹${used.toLocaleString()} / ₹${limit.toLocaleString()}`}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => startEdit(category)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Progress value={pct} />
                {over && (
                  <p className="text-xs text-destructive">
                    Over budget by ₹{(used - limit).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
