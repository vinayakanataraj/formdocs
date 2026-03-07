export default function AdminLoading() {
  return (
    <div className="p-8">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-[3px] mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border rounded-[6px] p-5 space-y-3">
            <div className="h-5 w-3/4 bg-muted animate-pulse rounded-[3px]" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded-[3px]" />
            <div className="h-4 w-1/3 bg-muted animate-pulse rounded-[3px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
