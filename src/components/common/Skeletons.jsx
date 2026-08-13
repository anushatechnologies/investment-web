import React from 'react';

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="mt-4 h-7 w-32 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50 flex gap-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <div key={idx} className="h-4 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className="h-4 flex-1 rounded bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-10 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-10 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-10 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-10 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="h-24 rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
