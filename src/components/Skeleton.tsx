export function SkeletonCard() {
  return (
    <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl p-6 space-y-4">
      <div className="skeleton h-4 w-32 rounded" />
      <div className="skeleton h-8 w-20 rounded" />
      <div className="skeleton h-3 w-48 rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden">
      <div className="p-6 border-b border-[#222222] flex items-center justify-between">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-8 w-24 rounded" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#222222] bg-[#0F1829]">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-4"><div className="skeleton h-3 w-20 rounded" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-[#222222]">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-6 py-4"><div className="skeleton h-3 rounded" style={{ width: `${60 + Math.random() * 40}%` }} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonKPI({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#1A1A1A] border border-[#222222] rounded-lg px-4 py-3 space-y-2">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-7 w-12 rounded" />
          <div className="skeleton h-2 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5 animate-page-enter">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-3 w-72 rounded" />
        </div>
        <div className="skeleton h-9 w-24 rounded" />
      </div>
      <SkeletonKPI count={4} />
      <SkeletonTable rows={4} cols={5} />
    </div>
  );
}
