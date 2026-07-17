import React, { useState } from 'react';
import { Employee } from '../types';
import { Flame, CheckCircle, XCircle, Users } from 'lucide-react';

interface ChartsProps {
  employees: Employee[];
  selectedDirektorat: string | null;
  setSelectedDirektorat: (dir: string | null) => void;
  selectedStatus: 'Activated' | 'Not Activated' | null;
  setSelectedStatus: (status: 'Activated' | 'Not Activated' | null) => void;
}

export default function Charts({
  employees,
  selectedDirektorat,
  setSelectedDirektorat,
  selectedStatus,
  setSelectedStatus,
}: ChartsProps) {
  const [hoveredDir, setHoveredDir] = useState<string | null>(null);

  // Group data by Direktorat
  const dirMap: { [key: string]: { totalKalori: number; count: number } } = {};
  let totalOverallKalori = 0;

  employees.forEach((emp) => {
    const dir = emp.direktorat || 'Lainnya';
    if (!dirMap[dir]) {
      dirMap[dir] = { totalKalori: 0, count: 0 };
    }
    dirMap[dir].totalKalori += emp.kalori;
    dirMap[dir].count += 1;
    totalOverallKalori += emp.kalori;
  });

  const dirData = Object.keys(dirMap).map((dir) => ({
    name: dir,
    totalKalori: dirMap[dir].totalKalori,
    count: dirMap[dir].count,
    avgKalori: Math.round(dirMap[dir].totalKalori / dirMap[dir].count),
  })).sort((a, b) => b.totalKalori - a.totalKalori);

  const maxDirKalori = dirData.length > 0 ? Math.max(...dirData.map((d) => d.totalKalori)) : 1;

  // Status calculation
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'Activated').length;
  const inactiveCount = totalCount - activeCount;

  const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
  const inactivePercent = totalCount > 0 ? 100 - activePercent : 0;

  // SVG Donut Calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const activeOffset = circumference - (activePercent / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Chart 1: Calories by Department */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Total Kalori per Direktorat</h3>
            </div>
            {selectedDirektorat && (
              <button
                onClick={() => setSelectedDirektorat(null)}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md transition-all cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Klik pada bar departemen untuk memfilter daftar karyawan. Departemen dengan konsumsi kalori tertinggi berada di atas.
          </p>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {dirData.map((dir) => {
              const isSelected = selectedDirektorat === dir.name;
              const isAnySelected = selectedDirektorat !== null;
              const percentOfMax = (dir.totalKalori / maxDirKalori) * 100;

              return (
                <div
                  key={dir.name}
                  className={`group cursor-pointer rounded-xl p-2 transition-all duration-200 ${
                    isSelected
                      ? 'bg-emerald-50/70 border border-emerald-100'
                      : isAnySelected
                      ? 'opacity-40 hover:opacity-80 border border-transparent'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                  onClick={() => setSelectedDirektorat(isSelected ? null : dir.name)}
                  onMouseEnter={() => setHoveredDir(dir.name)}
                  onMouseLeave={() => setHoveredDir(null)}
                >
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1.5">
                    <span className="truncate pr-2 group-hover:text-emerald-600 transition-colors">
                      {dir.name}
                    </span>
                    <span className="font-mono text-slate-900 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-normal">({dir.count} staf)</span>
                      <strong>{dir.totalKalori.toLocaleString('id-ID')}</strong> <span className="text-[10px] text-slate-400">kcal</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected 
                          ? 'bg-emerald-500' 
                          : dir.name.includes('OUTSOURCING') 
                          ? 'bg-teal-400' 
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.max(percentOfMax, 3)}%` }}
                    />
                  </div>
                  {hoveredDir === dir.name && (
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>Rata-rata: {dir.avgKalori} kcal/staf</span>
                      <span>{Math.round((dir.totalKalori / (totalOverallKalori || 1)) * 100)}% dari total</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart 2: Status Doughnut Ratio */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Status Aktivasi</h3>
            </div>
            {selectedStatus && (
              <button
                onClick={() => setSelectedStatus(null)}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md transition-all cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Rasio karyawan yang telah diaktifkan akunnya vs tidak aktif.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* Doughnut SVG */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="fill-none stroke-rose-100"
                  strokeWidth="12"
                />
                {/* Active Segment */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="fill-none stroke-emerald-500 transition-all duration-1000 ease-out"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={activeOffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-800">{activePercent}%</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Activated</span>
              </div>
            </div>

            {/* Labels and Filter Triggers */}
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {/* Active */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'Activated' ? null : 'Activated')}
                className={`flex items-center justify-between sm:justify-start gap-4 p-2.5 rounded-xl border transition-all text-left cursor-pointer w-full sm:w-44 ${
                  selectedStatus === 'Activated'
                    ? 'bg-emerald-50 border-emerald-100 ring-2 ring-emerald-500/10'
                    : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-none" />
                  <div>
                    <div className="text-xs font-semibold text-slate-700">Activated</div>
                    <div className="text-[10px] text-slate-400 font-mono">{activeCount} Karyawan</div>
                  </div>
                </div>
                <div className="text-xs font-black text-slate-800 font-mono ml-auto sm:ml-2">
                  {activePercent}%
                </div>
              </button>

              {/* Inactive */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'Not Activated' ? null : 'Not Activated')}
                className={`flex items-center justify-between sm:justify-start gap-4 p-2.5 rounded-xl border transition-all text-left cursor-pointer w-full sm:w-44 ${
                  selectedStatus === 'Not Activated'
                    ? 'bg-rose-50 border-rose-100 ring-2 ring-rose-500/10'
                    : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500 flex-none" />
                  <div>
                    <div className="text-xs font-semibold text-slate-700">Not Activated</div>
                    <div className="text-[10px] text-slate-400 font-mono">{inactiveCount} Karyawan</div>
                  </div>
                </div>
                <div className="text-xs font-black text-slate-800 font-mono ml-auto sm:ml-2">
                  {inactivePercent}%
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
