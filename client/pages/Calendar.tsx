import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, TrendingDown, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import type { Transaction } from "@shared/api";
import { useUserData } from "@/hooks/use-user-data";

export default function CalendarPage() {
  const userDataHook = useUserData();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const saved = userDataHook.getTransactions();
    setTransactions(saved);
  }, []);

  // Get all dates that have transactions
  const datesWithTransactions = useMemo(() => {
    const dateMap = new Map<string, number>();
    transactions.forEach(t => {
      const dateKey = format(new Date(t.date), "yyyy-MM-dd");
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + t.amount);
    });
    return dateMap;
  }, [transactions]);

  // Get transactions for selected date
  const selectedDateTransactions = useMemo(() => {
    return transactions.filter(t => isSameDay(new Date(t.date), selectedDate));
  }, [transactions, selectedDate]);

  // Calculate summary for selected date
  const dailyTotal = selectedDateTransactions.reduce((sum, t) => sum + t.amount, 0);
  const dailyCount = selectedDateTransactions.length;

  // Custom day styles for calendar
  const getDayClassName = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const hasTrans = datesWithTransactions.has(dateKey);
    const isSelected = isSameDay(date, selectedDate);

    let classes = "relative h-10 w-10 p-0 font-normal";
    if (hasTrans) {
      classes += " font-semibold";
    }
    if (isSelected) {
      classes += " bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white";
    }
    return classes;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Calendar view</h1>
        <p className="text-muted-foreground">Track your daily expenses at a glance. Click a date to see details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5"/> Select date</CardTitle>
            <CardDescription>Click on dates with expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              {format(selectedDate, "MMMM dd, yyyy")}
            </CardTitle>
            <CardDescription>
              {dailyCount === 0
                ? "No expenses recorded for this date"
                : `${dailyCount} transaction${dailyCount !== 1 ? 's' : ''} totaling ₹${dailyTotal.toLocaleString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDateTransactions.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">No expenses for this date. Start by adding one in the Dashboard!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.category}</p>
                    </div>
                    <p className="font-semibold">₹{transaction.amount.toLocaleString()}</p>
                  </div>
                ))}

                <div className="border-t pt-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Daily Total</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                      ₹{dailyTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses this month</CardTitle>
          <CardDescription>Dates with expenses are highlighted in the calendar</CardDescription>
        </CardHeader>
        <CardContent>
          {datesWithTransactions.size === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses recorded this month. Add expenses to see them appear!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(datesWithTransactions.entries())
                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                .map(([dateKey, amount]) => (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(new Date(dateKey))}
                    className="text-left rounded-lg border p-3 hover:bg-gradient-to-br hover:from-fuchsia-500/10 hover:to-indigo-500/10 transition-colors"
                  >
                    <p className="text-sm font-medium">{format(new Date(dateKey), "MMM dd, yyyy")}</p>
                    <p className="text-lg font-bold text-foreground">₹{amount.toLocaleString()}</p>
                  </button>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
