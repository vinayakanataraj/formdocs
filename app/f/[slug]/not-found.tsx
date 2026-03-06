export default function FormNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 px-6">
        <div className="text-6xl">📋</div>
        <h1 className="text-2xl font-semibold">Form not found</h1>
        <p className="text-muted-foreground">
          This form doesn&apos;t exist or may have been removed.
        </p>
      </div>
    </div>
  );
}
