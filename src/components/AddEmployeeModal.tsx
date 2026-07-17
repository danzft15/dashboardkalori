import React, { useState } from 'react';
import { Employee } from '../types';
import { X, User, Hash, Briefcase, Activity, Flame, HelpCircle } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Omit<Employee, ''>) => void;
  existingDirektorat: string[];
}

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onSave,
  existingDirektorat,
}: AddEmployeeModalProps) {
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [direktorat, setDirektorat] = useState('');
  const [customDirektorat, setCustomDirektorat] = useState('');
  const [isCustomDir, setIsCustomDir] = useState(false);
  const [status, setStatus] = useState<'Activated' | 'Not Activated'>('Activated');
  const [kalori, setKalori] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nik.trim() || !name.trim()) {
      setError('NIK dan Nama Karyawan wajib diisi!');
      return;
    }

    const finalDir = isCustomDir ? customDirektorat.trim() : direktorat;
    if (!finalDir) {
      setError('Direktorat harus diisi/dipilih!');
      return;
    }

    const kaloriNum = Number(kalori);
    if (isNaN(kaloriNum) || kaloriNum < 0) {
      setError('Kalori harus berupa angka positif!');
      return;
    }

    onSave({
      nik: nik.trim(),
      name: name.toUpperCase().trim(),
      direktorat: finalDir.toUpperCase(),
      status,
      kalori: kaloriNum,
    });

    // Reset Form
    setNik('');
    setName('');
    setDirektorat('');
    setCustomDirektorat('');
    setIsCustomDir(false);
    setStatus('Activated');
    setKalori('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-800">Tambah Karyawan Baru</h3>
            <p className="text-xs text-slate-500">Masukkan data karyawan untuk direkam di sistem</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* NIK Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              NIK (Nomor Induk Karyawan)
            </label>
            <input
              type="text"
              placeholder="Contoh: 10800789"
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 bg-slate-50/50 transition-all"
            />
          </div>

          {/* Nama Karyawan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Nama Lengkap Karyawan
            </label>
            <input
              type="text"
              placeholder="Contoh: EKO KURNIAWAN"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 bg-slate-50/50 transition-all"
            />
          </div>

          {/* Direktorat Dropdown / Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Direktorat / Divisi
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomDir(!isCustomDir);
                  setDirektorat('');
                  setCustomDirektorat('');
                }}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {isCustomDir ? 'Pilih yang sudah ada' : 'Ketik Manual Direktorat'}
              </button>
            </div>

            {isCustomDir ? (
              <input
                type="text"
                placeholder="Contoh: EPM - CFD (OUTSOURCING)"
                value={customDirektorat}
                onChange={(e) => setCustomDirektorat(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 bg-slate-50/50 transition-all"
              />
            ) : (
              <select
                value={direktorat}
                onChange={(e) => setDirektorat(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 bg-slate-50/50 transition-all cursor-pointer"
              >
                <option value="">-- Pilih Direktorat --</option>
                {existingDirektorat.map((dir) => (
                  <option key={dir} value={dir}>
                    {dir}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status Option */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Status Aktivasi
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 bg-slate-50/50 transition-all cursor-pointer"
              >
                <option value="Activated">Activated</option>
                <option value="Not Activated">Not Activated</option>
              </select>
            </div>

            {/* Kalori Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-slate-400" />
                Jumlah Total Kalori (kcal)
              </label>
              <input
                type="number"
                placeholder="Contoh: 1500"
                value={kalori}
                onChange={(e) => setKalori(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-slate-700 bg-slate-50/50 transition-all"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-emerald-600/10"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
