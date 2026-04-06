import { useState, useEffect } from "react";

declare global {
  interface Window {
    Tesseract: any;
  }
}

export function useTesseractOCR() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Load Tesseract.js from CDN
  useEffect(() => {
    if (window.Tesseract) {
      setIsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => {
      setIsReady(true);
    };
    document.head.appendChild(script);
  }, []);

  const extractTextFromImage = async (file: File): Promise<string> => {
    if (!window.Tesseract) {
      throw new Error("Tesseract OCR library not loaded. Please reload the page.");
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const imageUrl = URL.createObjectURL(file);
      const { data } = await window.Tesseract.recognize(imageUrl, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      URL.revokeObjectURL(imageUrl);
      setIsProcessing(false);
      return data.text || "";
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };

  return {
    extractTextFromImage,
    isProcessing,
    progress,
    isReady,
  };
}
