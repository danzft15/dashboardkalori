import React, { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
  isHighlighted?: boolean;
}

export default function MetricCard({
  title,
  value,
  subValue,
  icon,
  colorClass,
  bgClass,
  isHighlighted = false,
}: MetricCardProps) {
  if (isHighlighted) {
    return (
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl border-0 p-5 shadow-lg shadow-emerald-900/15 hover:shadow-xl hover:shadow-emerald-900/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between group overflow-hidden relative border border-emerald-500/10">
        <div className="space-y-1.5 z-10 max-w-[70%]">
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {title}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white tracking-tight leading-snug drop-shadow-sm truncate block max-w-full" title={String(value)}>
              {value}
            </span>
          </div>
          {subValue && (
            <p className="text-[10px] text-emerald-50/95 font-semibold bg-emerald-500/35 px-2 py-0.5 rounded-lg w-max backdrop-blur-xs truncate max-w-full" title={subValue}>
              {subValue}
            </p>
          )}
        </div>

        <div className="p-3.5 bg-amber-400 text-emerald-950 rounded-2xl transition-all duration-300 group-hover:scale-110 z-10 shadow-md shadow-amber-400/25 flex items-center justify-center">
          {icon}
        </div>

        {/* Decorative subtle background circle */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white opacity-[0.08] group-hover:scale-125 transition-all duration-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex items-center justify-between group overflow-hidden relative">
      <div className="space-y-1.5 z-10 max-w-[70%]">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-800 tracking-tight truncate block max-w-full" title={String(value)}>
            {value}
          </span>
        </div>
        {subValue && (
          <p className="text-[11px] text-slate-500 font-medium truncate max-w-full" title={subValue}>
            {subValue}
          </p>
        )}
      </div>

      <div className={`p-3.5 ${bgClass} ${colorClass} rounded-2xl transition-all duration-300 group-hover:scale-110 z-10`}>
        {icon}
      </div>

      {/* Decorative subtle background circle */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${bgClass} opacity-10 group-hover:scale-125 transition-all duration-500`} />
    </div>
  );
}

