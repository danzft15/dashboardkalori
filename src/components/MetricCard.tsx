import React, { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
}

export default function MetricCard({
  title,
  value,
  subValue,
  icon,
  colorClass,
  bgClass,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex items-center justify-between group overflow-hidden relative">
      <div className="space-y-1.5 z-10">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-800 tracking-tight">
            {value}
          </span>
        </div>
        {subValue && (
          <p className="text-[11px] text-slate-500 font-medium">
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
