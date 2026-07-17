import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { Search, Filter, Shield, Plus, ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

interface EmployeeTableProps {
  employees: Employee[];
  selectedDirektorat: string | null;
  setSelectedDirektorat: (dir: string | null) => void;
  selectedStatus: 'Activated' | 'Not Activated' | null;
  setSelectedStatus: (status: 'Activated' | 'Not Activated' | null) => void;
  onAddEmployeeClick: () => void;
  onDeleteEmployee?: (nik: string) => void;
  isCustomSource: boolean;
}

export default function EmployeeTable({
  employees,
  selectedDirektorat,
  setSelectedDirektorat,
  selectedStatus,
  setSelectedStatus,
  onAddEmployeeClick,
  onDeleteEmployee,
  isCustomSource,
}: EmployeeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'kalori_desc' | 'kalori_asc' | 'nik'>('kalori_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dynamically get list of all direktorat
  const direktoratOptions = useMemo(() => {
    const list = Array.from(new Set(employees.map((e) => e.direktorat)));
    return list.filter(Boolean).sort();
  }, [employees]);

  // Find max calories to calculate relative percentage bar
  const maxCalories = useMemo(() => {
    const vals = employees.map((e) => e.kalori);
    return vals.length > 0 ? Math.max(...vals, 1000) : 1000;
  }, [employees]);

  // Filter & Search & Sort
  const filteredEmployees = useMemo(() => {
    setCurrentPage(1); // reset page on filter change
    return employees
      .filter((emp) => {
        const matchesSearch =
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.nik.includes(searchTerm);
        
        const matchesDir = selectedDirektorat ? emp.direktorat === selectedDirektorat : true;
        const matchesStatus = selectedStatus ? emp.status === selectedStatus : true;

        return matchesSearch && matchesDir && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'kalori_desc') {
          return b.kalori - a.kalori;
        } else if (sortBy === 'kalori_asc') {
          return a.kalori - b.kalori;
        } else if (sortBy === 'nik') {
          return a.nik.localeCompare(b.nik);
        }
        return 0;
      });
  }, [employees, searchTerm, selectedDirektorat, selectedStatus, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header / Action Bar */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Daftar Kalori Karyawan</h3>
          <p className="text-xs text-slate-500">Menampilkan {filteredEmployees.length} dari {employees.length} total karyawan</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Employee Button */}
          <button
            onClick={onAddEmployeeClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/10 hover:shadow-md hover:shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 border-b border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama atau NIK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 transition-colors bg-slate-50/50"
          />
        </div>

        {/* Direktorat Filter */}
        <div className="md:col-span-3 relative">
          <select
            value={selectedDirektorat || ''}
            onChange={(e) => setSelectedDirektorat(e.target.value || null)}
            className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 transition-colors bg-slate-50/50 appearance-none cursor-pointer"
          >
            <option value="">Semua Direktorat</option>
            {direktoratOptions.map((dir) => (
              <option key={dir} value={dir}>{dir}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-2 relative">
          <select
            value={selectedStatus || ''}
            onChange={(e) => setSelectedStatus((e.target.value as any) || null)}
            className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 transition-colors bg-slate-50/50 appearance-none cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="Activated">Activated</option>
            <option value="Not Activated">Not Activated</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
        </div>

        {/* Sorting Filter */}
        <div className="md:col-span-3 relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 transition-colors bg-slate-50/50 appearance-none cursor-pointer"
          >
            <option value="kalori_desc">Kalori tertinggi</option>
            <option value="kalori_asc">Kalori terendah</option>
            <option value="name">Urutan Nama (A-Z)</option>
            <option value="nik">Urutan NIK</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-5 w-28">NIK</th>
              <th className="py-3 px-5">Nama Karyawan</th>
              <th className="py-3 px-5">Direktorat</th>
              <th className="py-3 px-5 w-32">Status</th>
              <th className="py-3 px-5 w-48">Jumlah Total Kalori</th>
              {onDeleteEmployee && <th className="py-3 px-5 w-16 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={onDeleteEmployee ? 6 : 5} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-500">Karyawan tidak ditemukan</p>
                    <p className="text-[11px] text-slate-400">Gunakan kata kunci pencarian atau bersihkan filter filter</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
                const percentage = Math.min(Math.round((emp.kalori / maxCalories) * 100), 100);
                return (
                  <tr key={emp.nik} className="hover:bg-slate-50/50 transition-colors group">
                    {/* NIK */}
                    <td className="py-3.5 px-5 font-mono text-slate-500 font-medium">
                      {emp.nik}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {emp.name}
                    </td>

                    {/* Direktorat */}
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold ${
                        emp.direktorat.includes('OUTSOURCING')
                          ? 'bg-sky-50 text-sky-700 border border-sky-100/50'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                      }`}>
                        {emp.direktorat}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      {emp.status === 'Activated' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-semibold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Not Activated
                        </span>
                      )}
                    </td>

                    {/* Calories bar & number */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center font-mono font-bold text-slate-800">
                          <span>{emp.kalori.toLocaleString('id-ID')}</span>
                          <span className="text-[10px] font-normal text-slate-400">kcal</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              emp.kalori > 3000
                                ? 'bg-amber-500'
                                : emp.kalori > 1000
                                ? 'bg-amber-400'
                                : emp.kalori > 0
                                ? 'bg-teal-400'
                                : 'bg-slate-200'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Delete action */}
                    {onDeleteEmployee && (
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => onDeleteEmployee(emp.nik)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/30">
        <span className="text-slate-500 font-medium">
          Halaman <strong className="text-slate-700">{currentPage}</strong> dari <strong className="text-slate-700">{totalPages}</strong>
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
