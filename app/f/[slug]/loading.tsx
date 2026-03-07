export default function FormLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[720px] mx-auto px-6 py-12 md:px-16 lg:px-24">
        {/* Title skeleton */}
        <div className="h-10 w-2/3 bg-muted animate-pulse rounded-[3px] mb-4" />
        {/* Description skeleton */}
        <div className="h-5 w-1/2 bg-muted animate-pulse rounded-[3px] mb-12" />
        {/* Field skeletons */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 mb-6">
            <div className="h-4 w-1/4 bg-muted animate-pulse rounded-[3px]" />
            <div className="h-10 w-full bg-muted animate-pulse rounded-[4px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
