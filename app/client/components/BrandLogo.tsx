import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="relative">
        <span className="absolute -inset-1 rounded-lg bg-gradient-to-tr from-fuchsia-500/30 to-indigo-500/30 blur" />
        <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-tr from-fuchsia-500 to-indigo-500 text-white shadow">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>
      <span className="text-lg font-extrabold tracking-tight">
        <span className="bg-gradient-to-tr from-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">Fin</span>
        <span className="text-foreground">Ai</span>
      </span>
    </div>
  );
}
