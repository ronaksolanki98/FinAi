import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader, Mail } from "lucide-react";
import { toast } from "sonner";
import { useTesseractOCR } from "@/hooks/use-tesseract-ocr";
import { useGmail } from "@/hooks/use-gmail";

export default function UploadPage() {
  const navigate = useNavigate();
  const { extractTextFromImage, isProcessing, progress } = useTesseractOCR();
  const { authState, initiateLogin } = useGmail();
  const [lastFile, setLastFile] = useState<string>("");
  const [lastFileContent, setLastFileContent] = useState<string>("");
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    const isImage = file.type.startsWith("image/");
    setLastFile(file.name);
    setIsLocalProcessing(true);
    toast("OCR started", { description: `${file.name} — extracting text from receipt...` });

    try {
      let text = "";

      if (isImage) {
        // Use Tesseract for images
        try {
          text = await extractTextFromImage(file);
          if (!text || text.trim().length === 0) {
            toast.error("Could not extract text from image", { description: "Image may be unclear. Please try another image." });
            setIsLocalProcessing(false);
            return;
          }
        } catch (e) {
          toast.error("Image OCR failed", { description: String(e) });
          setIsLocalProcessing(false);
          return;
        }
      } else {
        // For text files
        const reader = new FileReader();
        reader.onload = async (e) => {
          const fileText = e.target?.result as string;
          if (!fileText || fileText.trim().length === 0) {
            toast.error("File is empty", { description: "Please upload a file with receipt content" });
            setIsLocalProcessing(false);
            return;
          }
          setLastFileContent(fileText);
          try {
            const resp = await fetch("/api/ocr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: file.name, text: fileText.slice(0, 5000) }),
            });
            const data = await resp.json();
            toast.success(`Parsed: ₹${data.amount} • ${data.category}`);
          } catch (e) {
            toast.error("OCR failed", { description: String(e) });
          } finally {
            setIsLocalProcessing(false);
          }
        };
        reader.readAsText(file);
        return;
      }

      // Process extracted image text
      setLastFileContent(text);
      try {
        const resp = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, text: text.slice(0, 5000) }),
        });
        const data = await resp.json();
        toast.success(`Parsed: ���${data.amount} • ${data.category}`);
      } catch (e) {
        toast.error("OCR parsing failed", { description: String(e) });
      } finally {
        setIsLocalProcessing(false);
      }
    } catch (e) {
      toast.error("File processing failed", { description: String(e) });
      setIsLocalProcessing(false);
    }
  }

  async function processWithAI() {
    if (!lastFile || !lastFileContent) {
      toast("Select a file first");
      return;
    }
    setIsLocalProcessing(true);
    try {
      const resp = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: lastFile, text: lastFileContent.slice(0, 5000), region: "IN" }),
      });
      const data = await resp.json();
      toast.success(`Parsed: ₹${data.amount} • ${data.category}`);
    } catch (e) {
      toast.error("AI processing failed", { description: String(e) });
    } finally {
      setIsLocalProcessing(false);
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Upload receipts & invoices</h1>
        <p className="text-muted-foreground">Images (JPG, PNG), PDFs, or text files. Advanced OCR will extract amount, date and merchant automatically.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5"/> Upload</CardTitle>
          <CardDescription>Upload receipt images, PDFs, or text files for automatic extraction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border-dashed border p-6 text-center">
            <Input
              type="file"
              accept="image/*,.txt,.pdf,.csv"
              onChange={(e)=>onUpload(e.target.files)}
              disabled={isProcessing || isLocalProcessing}
            />
            {(isProcessing || isLocalProcessing) && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing... {progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Drag & drop supported. Images processed with advanced Tesseract OCR.</p>
          </div>
          {lastFile && (
            <div className="rounded-md border p-3 text-sm flex items-center gap-2"><FileText className="h-4 w-4"/>Last uploaded: {lastFile}</div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={isProcessing || isLocalProcessing}
              onClick={() => {
                if (authState.isAuthenticated) {
                  navigate("/gmail-invoices");
                } else {
                  initiateLogin();
                }
              }}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              {authState.isAuthenticated ? "View Gmail Invoices" : "Fetch from Gmail"}
            </Button>
            <Button onClick={processWithAI} disabled={isProcessing || isLocalProcessing}>
              {isProcessing || isLocalProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process with AI"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
