import { useRef, useState, useEffect, type DragEvent, type ChangeEvent } from "react";
import { UploadCloud, Sparkles, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_SIZE = 5 * 1024 * 1024;

const CVUploader = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (f: File): string | null => {
    if (f.type !== "application/pdf") return "El archivo debe ser un PDF válido.";
    if (f.size > MAX_SIZE) return "El archivo supera el tamaño máximo de 5 MB.";
    return null;
  };

  const processFile = (f: File) => {
    const err = validate(f);
    if (err) {
      setError(err);
      setFile(null);
    } else {
      setFile(f);
      setError(null);
      setIsAnalyzing(true);
    }
  };

  useEffect(() => {
    if (!isAnalyzing) return;
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
      setIsSuccess(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAnalyzing]);

  const resetAll = () => {
    setFile(null);
    setError(null);
    setIsAnalyzing(false);
    setIsSuccess(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Analyzing state
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-card p-16 text-center">
        <Loader2 className="h-14 w-14 animate-spin text-primary" strokeWidth={1.5} />
        <div className="space-y-2">
          <p className="text-base font-medium text-foreground">{file?.name}</p>
          <p className="animate-pulse text-sm text-muted-foreground">
            Analizando candidato con IA...
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-card p-16 text-center">
        <CheckCircle2 className="h-14 w-14 text-[hsl(var(--success))]" strokeWidth={1.5} />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">¡CV analizado con éxito!</p>
          <p className="text-sm text-muted-foreground">{file?.name}</p>
        </div>
        <Button variant="outline" onClick={resetAll}>
          Analizar otro documento
        </Button>
      </div>
    );
  }

  // Default drop zone
  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          group relative cursor-pointer rounded-xl border-2 border-dashed p-12
          transition-all duration-200 ease-in-out
          flex flex-col items-center justify-center gap-4 text-center
          ${
            isDragging
              ? "border-[hsl(var(--drop-zone-active-border))] bg-[hsl(var(--drop-zone-active))]"
              : "border-[hsl(var(--drop-zone-border))] bg-[hsl(var(--drop-zone))] hover:border-[hsl(var(--drop-zone-active-border))] hover:bg-[hsl(var(--drop-zone-active))]"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleChange}
        />

        <div className="relative">
          <UploadCloud
            className={`h-14 w-14 transition-colors duration-200 ${
              isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            }`}
            strokeWidth={1.5}
          />
          <Sparkles
            className="absolute -right-2 -top-2 h-5 w-5 text-primary opacity-70"
            strokeWidth={2}
          />
        </div>

        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            Arrastra y suelta el CV del candidato aquí
          </p>
          <p className="text-sm text-muted-foreground">
            o haz clic para explorar en tus archivos
          </p>
        </div>

        <p className="text-xs text-muted-foreground/70 mt-2">
          <Sparkles className="inline h-3 w-3 mr-1 -mt-0.5" />
          La IA analizará automáticamente el documento. Solo PDF (Máx. 5MB).
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CVUploader;
