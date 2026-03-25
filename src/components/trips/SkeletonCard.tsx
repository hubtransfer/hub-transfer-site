"use client";

export default function SkeletonCard() {
  return (
    <div className="bg-[#111] rounded-2xl border border-white/5 border-l-4 border-l-white/10 overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 py-4">
        {/* Time placeholder */}
        <div className="flex-shrink-0 w-14">
          <div className="h-6 w-12 bg-white/5 rounded" />
        </div>
        {/* Name + badge */}
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-white/5 rounded" />
          <div className="h-3 w-20 bg-white/5 rounded" />
        </div>
        {/* Price */}
        <div className="h-4 w-8 bg-white/5 rounded" />
      </div>
      {/* Flight bar placeholder */}
      <div className="px-4 pb-3">
        <div className="h-2.5 w-full bg-white/[0.03] rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
