import CVUploader from "@/components/CVUploader";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Haire
          </h1>
          <p className="text-sm text-muted-foreground">
            Reclutamiento potenciado por IA
          </p>
        </div>
        <CVUploader />
      </div>
    </div>
  );
};

export default Index;
