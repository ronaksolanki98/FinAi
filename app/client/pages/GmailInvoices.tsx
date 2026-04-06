import { useState, useEffect } from "react";
import { useGmail } from "@/hooks/use-gmail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Download, LogOut, RefreshCw, Loader } from "lucide-react";
import { toast } from "sonner";

export default function GmailInvoicesPage() {
  const { authState, invoices, isLoading, initiateLogin, fetchInvoices, logout, downloadInvoice } = useGmail();
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (authState.isAuthenticated && !hasFetched) {
      fetchInvoices().then(() => setHasFetched(true));
    }
  }, [authState.isAuthenticated, hasFetched, fetchInvoices]);

  if (!authState.isAuthenticated) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Gmail Invoices</h1>
          <p className="text-muted-foreground">Connect your Gmail account to automatically fetch invoices and bills.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Connect Gmail
            </CardTitle>
            <CardDescription>
              Securely fetch invoices, receipts, and bills from your Gmail inbox
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-6 text-center space-y-4">
              <div className="flex justify-center">
                <Mail className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Connect Your Gmail Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We'll fetch PDF invoices from your inbox automatically. Your data stays private and secure.
                </p>
              </div>
              <Button onClick={initiateLogin} size="lg" className="gap-2">
                <Mail className="h-4 w-4" />
                Connect Gmail
              </Button>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">What we'll access:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Read-only access to your Gmail inbox</li>
                <li>PDF attachments from emails</li>
                <li>Email headers (subject, sender, date)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Gmail Invoices</h1>
          <p className="text-muted-foreground">Connected as {authState.userEmail}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices from Gmail</CardTitle>
              <CardDescription>
                Found {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setHasFetched(false);
                fetchInvoices();
              }}
              disabled={isLoading}
              size="sm"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No invoices found in your Gmail</p>
              <p className="text-sm text-muted-foreground mt-1">We search for emails with PDF attachments containing keywords like "invoice", "bill", or "receipt"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold truncate">{invoice.fileName}</h4>
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {invoice.date}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{invoice.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">From: {invoice.from}</p>
                  </div>
                  <Button
                    onClick={() => downloadInvoice(invoice)}
                    variant="ghost"
                    size="sm"
                    className="ml-2 flex-shrink-0 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
