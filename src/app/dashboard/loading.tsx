export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-white/5 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-white/5 rounded-lg animate-pulse" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="h-3 w-20 bg-white/5 rounded animate-pulse mb-3" />
            <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="card mb-6">
        <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-4" />
        <div className="h-48 bg-white/5 rounded-lg animate-pulse" />
      </div>

      {/* Trades skeleton */}
      <div className="card">
        <div className="h-4 w-28 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
