export default function DashboardLoading() {
  return (
    <div className="p-6 relative min-h-full w-full">
      {/* Header Skeleton */}
      <header className="mb-8 mt-2">
        <div className="h-8 bg-surface rounded-xl w-3/4 animate-pulse mb-3"></div>
        <div className="h-4 bg-surface rounded-md w-1/2 animate-pulse"></div>
      </header>

      {/* Balance Card Skeleton */}
      <section className="bg-surface rounded-3xl p-5 mb-8 border border-border">
        <div className="h-3 bg-gray-200 rounded-md w-1/3 animate-pulse mb-6"></div>
        <div className="flex justify-between items-center px-2">
          
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded-md w-12 animate-pulse mt-3"></div>
            <div className="h-6 bg-gray-200 rounded-md w-8 animate-pulse mt-2"></div>
          </div>
          
          <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse opacity-50"></div>
          
          <div className="flex flex-col items-center opacity-90">
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded-md w-12 animate-pulse mt-3"></div>
            <div className="h-6 bg-gray-200 rounded-md w-8 animate-pulse mt-2"></div>
          </div>

        </div>
      </section>

      {/* Tasks List Skeleton */}
      <section>
        <div className="h-6 bg-surface rounded-lg w-1/2 animate-pulse mb-5"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center p-4 bg-white border border-border rounded-2xl shadow-sm">
              <div className="w-6 h-6 rounded-full bg-surface animate-pulse mr-4 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-surface rounded-md w-3/4 animate-pulse mb-2"></div>
                <div className="h-3 bg-surface rounded-md w-1/4 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
