import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Transaction } from "@shared/api";
import { useUserData } from "@/hooks/use-user-data";

export default function ExportPage() {
  const userDataHook = useUserData();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedTransactions = userDataHook.getTransactions();
      setTransactions(savedTransactions);
    } catch (error) {
      toast.error("Failed to load transactions", { description: String(error) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  function exportCSV() {
    if (transactions.length === 0) {
      toast.error("No transactions to export", { description: "Add some expenses first!" });
      return;
    }

    try {
      const headers = ["id", "date", "description", "amount", "category"];
      const rows = transactions.map(t => [
        t.id,
        format(new Date(t.date), "yyyy-MM-dd"),
        `"${t.description}"`, // Quote descriptions in case they contain commas
        t.amount.toString(),
        t.category
      ]);

      const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finai-export-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported", { description: `${transactions.length} transactions exported` });
    } catch (error) {
      toast.error("Export failed", { description: String(error) });
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Export for taxes</h1>
        <p className="text-muted-foreground">Download CSV compatible with Excel and most tax portals.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5"/> Export</CardTitle>
          <CardDescription>
            {isLoading ? "Loading transactions..." : `${transactions.length} transactions ready to export`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader className="h-4 w-4 animate-spin" />
              Loading your transactions...
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet. Add expenses to export them.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Click below to download all your transactions as a CSV file compatible with Excel and tax software.
              </p>
              <Button onClick={exportCSV} size="lg">
                <Download className="mr-2 h-4 w-4"/>
                Download CSV ({transactions.length} transactions)
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
