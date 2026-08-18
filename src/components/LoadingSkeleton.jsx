function LoadingSkeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-stone-200 rounded ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-stone-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton 
              key={colIndex} 
              className="h-4 flex-1" 
              style={{ 
                width: colIndex === 0 ? '20%' : colIndex === 1 ? '25%' : '15%' 
              }} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card">
      <LoadingSkeleton className="h-6 w-3/4 mb-4" />
      <LoadingSkeleton className="h-4 w-1/2 mb-2" />
      <LoadingSkeleton className="h-4 w-1/3" />
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <LoadingSkeleton className="h-4 w-24 mb-2" />
          <LoadingSkeleton className="h-8 w-16" />
        </div>
        <LoadingSkeleton className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  );
}

export default LoadingSkeleton;
