import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Calendar as CalendarIcon, AlertTriangle, LineChart as LineChartIcon, BarChart3, Trash2, Plus, Loader } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { Transaction, CategoryKey, InsightsResponse, OCRResponse } from "@shared/api";
import { useUserData } from "@/hooks/use-user-data";
import { useTesseractOCR } from "@/hooks/use-tesseract-ocr";

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

export default function Dashboard() {
  const userDataHook = useUserData();
  const { extractTextFromImage, isProcessing, progress } = useTesseractOCR();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Record<CategoryKey, number>>({} as Record<CategoryKey, number>);
  const [tab, setTab] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [insights, setInsights] = useState<string[]>([]);
  const [manualAmount, setManualAmount] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualCategory, setManualCategory] = useState<CategoryKey>("Food");
  const [ocrProgress, setOcrProgress] = useState(0);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTransactions = userDataHook.getTransactions();
    const savedBudgets = userDataHook.getBudgets();
    setTransactions(savedTransactions);
    setBudgets(savedBudgets);
  }, []);

  // Save transactions whenever they change
  useEffect(() => {
    userDataHook.setTransactions(transactions);
  }, [transactions]);

  // Filter transactions by selected month
  const filteredTransactions = useMemo(() => {
    const [year, month] = selectedMonth.split("-");
    const startDate = startOfMonth(new Date(`${year}-${month}-01`));
    const endDate = endOfMonth(startDate);

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });
  }, [transactions, selectedMonth]);

  const totalsByCategory = useMemo(() => {
    const map: Record<CategoryKey, number> = { Food:0, Transport:0, Shopping:0, Bills:0, Subscriptions:0, Health:0, Other:0 };
    for (const t of filteredTransactions) map[t.category] += t.amount;
    return map;
  }, [filteredTransactions]);

  const totalSpend = Object.values(totalsByCategory).reduce((a,b)=>a+b,0);

  async function refreshInsights() {
    try {
      const resp = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactions, budgets }) });
      const data = (await resp.json()) as InsightsResponse;
      setInsights(data.tips);
    } catch {}
  }

  const chartData = useMemo(() => {
    const days = 7;
    const data = Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const label = format(d, "MMM d");
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const daySpend = filteredTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return tDate >= dayStart && tDate <= dayEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return { name: label, spend: daySpend };
    });
    return data;
  }, [filteredTransactions]);

  // Recompute tips when filtered transactions change
  useEffect(() => {
    refreshInsights();
  }, [filteredTransactions, budgets]);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    const isImage = file.type.startsWith("image/");

    toast("Processing receipt with OCR", { description: `${file.name} — extracting text from receipt...` });

    try {
      let extractedText = "";

      if (isImage) {
        // Use Tesseract for images
        if (!isProcessing && extractTextFromImage) {
          setOcrProgress(0);
          try {
            extractedText = await extractTextFromImage(file);
            if (!extractedText || extractedText.trim().length === 0) {
              toast.error("Could not extract text from image", { description: "Image may be unclear. Please try another image." });
              return;
            }
            setOcrProgress(100);
          } catch (error) {
            toast.error("Image OCR failed", { description: String(error) });
            return;
          }
        } else {
          toast.error("OCR engine loading", { description: "Please wait a moment and try again." });
          return;
        }
      } else {
        // For text files, read as text
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          if (!text || text.trim().length === 0) {
            toast.error("File is empty", { description: "Please upload a file with receipt content" });
            return;
          }
          await processExtractedText(file.name, text);
        };
        reader.readAsText(file);
        return;
      }

      // Process the extracted text from image
      await processExtractedText(file.name, extractedText);
    } catch (e) {
      toast.error("File processing failed", { description: String(e) });
    }
  }

  async function processExtractedText(fileName: string, text: string) {
    try {
      const resp = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fileName, text: text.slice(0, 5000) }),
      });

      if (!resp.ok) {
        throw new Error(`Server error: ${resp.status}`);
      }

      const data = (await resp.json()) as OCRResponse;

      if (!data.amount || data.amount === 0) {
        toast.error("Could not extract amount", { description: "No valid amount found in receipt. Please check the image quality." });
        return;
      }

      const newTx: Transaction = {
        id: Math.random().toString(36).slice(2),
        date: data.date,
        description: data.description,
        amount: data.amount,
        category: data.category,
      };
      setTransactions((prev) => [newTx, ...prev]);
      toast.success("Receipt processed", { description: `${data.description} → ₹${data.amount} (${data.category})` });
    } catch (error) {
      toast.error("OCR parsing failed", { description: String(error) });
    }
  }

  function handleAddManualExpense() {
    if (!manualAmount || !manualDescription) {
      toast.error("Please fill in all fields");
      return;
    }

    const newTx: Transaction = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      description: manualDescription,
      amount: parseFloat(manualAmount),
      category: manualCategory,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setManualAmount("");
    setManualDescription("");
    setManualCategory("Food");
    toast.success("Expense added", { description: `₹${manualAmount} added to ${manualCategory}` });
  }

  function deleteTransaction(id: string) {
    setTransactions((prev) => prev.filter(t => t.id !== id));
    toast.success("Expense deleted");
  }

  function exportCSV() {
    const headers = ["id","date","description","amount","category"];
    const rows = transactions.map(t => [t.id, t.date, t.description, t.amount.toString(), t.category]);
    const csv = [headers.join(","), ...rows.map(r=>r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finai-transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const alerts = Object.entries(totalsByCategory)
    .filter(([k, v]) => v > budgets[k as CategoryKey])
    .map(([k]) => `${k} budget exceeded`);

  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = format(date, "yyyy-MM");
      const label = format(date, "MMMM yyyy");
      options.push({ value, label });
    }
    return options;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Track expenses, budgets, insights and forecasts</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4"/>Export CSV</Button>
          <Button className="bg-gradient-to-tr from-fuchsia-600 to-indigo-600"><LineChartIcon className="mr-2 h-4 w-4"/>Generate Forecast</Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5"/>Budget Alerts</CardTitle>
            <CardDescription>These categories exceeded their monthly limits</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-1">
              {alerts.map((a)=> (<li key={a}>{a}</li>))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5"/> Spending Trend</CardTitle>
            <CardDescription>Recent daily spending</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 0, right: 8, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <Tooltip />
                <Line type="monotone" dataKey="spend" stroke="#8b5cf6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Total spend this month</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={Object.entries(totalsByCategory).map(([name, value])=>({ name, value }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {Object.entries(totalsByCategory).map(([name], idx)=> (
                    <Cell key={name} fill={categoryColors[name as CategoryKey]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5"/> Upload Receipts</CardTitle>
            <CardDescription>PDFs or images. OCR will auto-extract details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border-dashed border p-6 text-center">
              <Input
                type="file"
                accept="image/*,.txt,.pdf,.csv"
                onChange={(e)=>onUpload(e.target.files)}
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing... {progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Upload receipt images (JPG, PNG), PDFs, or text files (TXT, CSV)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Add Expense Manually</CardTitle>
            <CardDescription>Quickly add expenses by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                type="text"
                placeholder="e.g., Lunch at restaurant"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={manualCategory} onValueChange={(val) => setManualCategory(val as CategoryKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddManualExpense} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Category-wise limits and usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {Object.keys(budgets).map((k)=>{
              const key = k as CategoryKey;
              const used = totalsByCategory[key] || 0;
              const pct = Math.min(100, Math.round((used / budgets[key]) * 100));
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: categoryColors[key] }}>{key}</span>
                    <span className={used>budgets[key]?"text-destructive":"text-muted-foreground"}>{`₹${used.toLocaleString()} / ₹${budgets[key].toLocaleString()}`}</span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5"/> Calendar & Reminders</CardTitle>
            <CardDescription>Upcoming tax deadlines and invoice dues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">Next GST filing</p>
                <p className="text-muted-foreground text-sm">Due on {format(new Date(Date.now()+1000*60*60*24*10), "MMM d, yyyy")}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">Unpaid invoice • Acme Corp</p>
                <p className="text-muted-foreground text-sm">Overdue by 3 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Personalized savings and risk alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.length ? insights.map((t, i)=> (<Insight key={i} text={t} />)) : (
              <div className="rounded-lg border bg-secondary p-3 text-sm">No tips yet — upload a receipt to generate insights.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="day">Today</TabsTrigger>
        </TabsList>
        <TabsContent value="month" className="space-y-4">
          <TransactionsTable transactions={filteredTransactions} onDelete={deleteTransaction} />
        </TabsContent>
        <TabsContent value="week">
          <TransactionsTable transactions={filteredTransactions.slice(0,5)} onDelete={deleteTransaction} />
        </TabsContent>
        <TabsContent value="day">
          <TransactionsTable transactions={filteredTransactions.slice(0,2)} onDelete={deleteTransaction} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Insight({ text }: { text: string }) {
  return (
    <div className="rounded-lg border bg-secondary p-3 text-sm">{text}</div>
  );
}

function TransactionsTable({ transactions, onDelete }: { transactions: Transaction[]; onDelete: (id: string) => void }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No expenses for this period</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 font-medium">Category</th>
            <th className="py-2 pr-4 font-medium text-right">Amount</th>
            <th className="py-2 pl-4 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t)=> (
            <tr key={t.id} className="border-b last:border-none hover:bg-muted/50">
              <td className="py-2 pr-4">{format(new Date(t.date), "MMM d, yyyy")}</td>
              <td className="py-2 pr-4">{t.description}</td>
              <td className="py-2 pr-4">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: categoryColors[t.category] }} />
                  {t.category}
                </span>
              </td>
              <td className="py-2 pl-4 text-right">₹{t.amount.toLocaleString()}</td>
              <td className="py-2 pl-4 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(t.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
