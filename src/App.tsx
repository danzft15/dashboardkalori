import React, { useState, useEffect, useMemo } from 'react';
import { Employee, DashboardStats, SheetIntegration } from './types';
import { SAMPLE_EMPLOYEES } from './data/sampleData';
import MetricCard from './components/MetricCard';
import Charts from './components/Charts';
import EmployeeTable from './components/EmployeeTable';
import AddEmployeeModal from './components/AddEmployeeModal';
import Instructions from './components/Instructions';
import { 
  Users, 
  CheckCircle, 
  Flame, 
  TrendingUp, 
  Database, 
  Link2, 
  HelpCircle, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  FileSpreadsheet,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function App() {
  // Main Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isCustomSource, setIsCustomSource] = useState(false);
  
  // Sheet Integration States
  const [sheetUrl, setSheetUrl] = useState('');
  const [connection, setConnection] = useState<SheetIntegration>({
    url: '',
    isConnected: false,
    lastFetched: null,
    isLoading: false,
    error: null
  });

  // UI States
  const [selectedDirektorat, setSelectedDirektorat] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'Activated' | 'Not Activated' | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Load initial settings and data on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('gas_sheet_url');
    const savedEmployees = localStorage.getItem('local_employees');

    if (savedUrl) {
      setSheetUrl(savedUrl);
      fetchLiveEmployees(savedUrl);
    } else if (savedEmployees) {
      try {
        setEmployees(JSON.parse(savedEmployees));
        showToast('info', 'Memuat data tersimpan dari penyimpanan lokal.');
      } catch (e) {
        setEmployees(SAMPLE_EMPLOYEES);
      }
    } else {
      setEmployees(SAMPLE_EMPLOYEES);
      localStorage.setItem('local_employees', JSON.stringify(SAMPLE_EMPLOYEES));
    }
  }, []);

  // Show auto-dismiss notifications
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // FETCH Data from Google Sheet Apps Script
  const fetchLiveEmployees = async (urlToFetch: string) => {
    if (!urlToFetch) return;
    
    setConnection(prev => ({ ...prev, isLoading: true, error: null }));
    showToast('info', 'Sedang mengambil data dari Google Sheet...');

    try {
      // We append a timestamp to bypass any aggressive cache
      const fetchUrl = new URL(urlToFetch);
      fetchUrl.searchParams.set('_t', Date.now().toString());

      const response = await fetch(fetchUrl.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result && result.status === 'success' && Array.isArray(result.data)) {
        setEmployees(result.data);
        setIsCustomSource(true);
        localStorage.setItem('gas_sheet_url', urlToFetch);
        setConnection({
          url: urlToFetch,
          isConnected: true,
          lastFetched: new Date().toLocaleTimeString('id-ID'),
          isLoading: false,
          error: null
        });
        showToast('success', `Berhasil memuat ${result.data.length} karyawan dari Google Sheet!`);
      } else {
        throw new Error(result?.message || 'Format JSON dari Google Apps Script tidak valid. Harap pastikan script mengembalikan array data.');
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || 'Gagal terhubung ke Google Apps Script. Pastikan URL benar, Web App telah dideploy sebagai "Anyone", dan CORS diizinkan.';
      
      setConnection(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      showToast('error', errorMessage);
    }
  };

  // CONNECT handler from UI input
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      showToast('error', 'Masukkan URL Google Apps Script yang valid terlebih dahulu!');
      return;
    }
    fetchLiveEmployees(sheetUrl.trim());
  };

  // DISCONNECT and fallback to local sample data
  const handleDisconnect = () => {
    localStorage.removeItem('gas_sheet_url');
    setSheetUrl('');
    setConnection({
      url: '',
      isConnected: false,
      lastFetched: null,
      isLoading: false,
      error: null
    });
    setIsCustomSource(false);
    
    // Restore local sample or stored employees
    const savedEmployees = localStorage.getItem('local_employees');
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    } else {
      setEmployees(SAMPLE_EMPLOYEES);
    }
    showToast('info', 'Terputus dari Google Sheet. Kembali menggunakan data contoh lokal.');
  };

  // ADD NEW EMPLOYEE (Handles both local state and GAS POST)
  const handleAddEmployee = async (newEmp: Omit<Employee, ''>) => {
    const fullNewEmployee: Employee = {
      nik: newEmp.nik,
      name: newEmp.name,
      direktorat: newEmp.direktorat,
      status: newEmp.status,
      kalori: newEmp.kalori
    };

    // Prevent duplicate NIK locally
    if (employees.some(e => e.nik === fullNewEmployee.nik)) {
      showToast('error', `NIK ${fullNewEmployee.nik} sudah terdaftar di database!`);
      return;
    }

    // 1. If connected to Google Sheet, perform real POST
    if (connection.isConnected && connection.url) {
      setConnection(prev => ({ ...prev, isLoading: true }));
      showToast('info', `Mengirim data karyawan ${fullNewEmployee.name} ke Google Sheet...`);

      try {
        // We send as text/plain to bypass CORS Preflight OPTIONS restriction on Google Apps Script Web App
        const res = await fetch(connection.url, {
          method: 'POST',
          mode: 'no-cors', // standard GAS redirect workaround
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(fullNewEmployee)
        });

        // Since we use no-cors, we can't inspect response body directly in browsers,
        // but we can assume success and trigger a GET to fetch the updated spreadsheet, or do an optimistic local add!
        // Let's do an optimistic update first, then pull the fresh data from the sheet.
        setEmployees(prev => [fullNewEmployee, ...prev]);
        showToast('success', `Karyawan ${fullNewEmployee.name} berhasil diusulkan ke Google Sheet!`);
        
        // Wait 2 seconds and reload to sync
        setTimeout(() => {
          fetchLiveEmployees(connection.url);
        }, 2200);

      } catch (err: any) {
        console.error(err);
        showToast('error', `Gagal menambahkan karyawan ke Google Sheet: ${err.message}`);
      } finally {
        setConnection(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      // 2. Offline Mode: Save to React state and localStorage
      const updatedList = [fullNewEmployee, ...employees];
      setEmployees(updatedList);
      localStorage.setItem('local_employees', JSON.stringify(updatedList));
      showToast('success', `Berhasil menambahkan karyawan ${fullNewEmployee.name} ke database lokal!`);
    }
  };

  // DELETE KARYAWAN (Offline-only helper or show warning if online)
  const handleDeleteEmployee = (nik: string) => {
    if (connection.isConnected) {
      showToast('info', 'Penghapusan data di Google Sheet harus dilakukan langsung dari file Spreadsheet Anda.');
      return;
    }

    const updated = employees.filter(e => e.nik !== nik);
    setEmployees(updated);
    localStorage.setItem('local_employees', JSON.stringify(updated));
    showToast('success', 'Karyawan berhasil dihapus dari database lokal.');
  };

  // DYNAMIC STATS CALCULATIONS
  const stats: DashboardStats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'Activated').length;
    const inactive = total - active;
    const totalKalori = employees.reduce((sum, e) => sum + e.kalori, 0);
    const avg = total > 0 ? Math.round(totalKalori / total) : 0;
    
    // Find employee with maximum calories
    let maxEmp: Employee | null = null;
    if (employees.length > 0) {
      maxEmp = [...employees].sort((a, b) => b.kalori - a.kalori)[0];
    }

    return {
      totalEmployees: total,
      activeEmployees: active,
      inactiveEmployees: inactive,
      totalCalories: totalKalori,
      avgCalories: avg,
      maxCaloriesEmployee: maxEmp
    };
  }, [employees]);

  // Extract existing unique direktorat options for dropdowns
  const uniqueDirektorat = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.direktorat))).filter(Boolean);
  }, [employees]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16 antialiased selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 text-xs font-medium animate-bounce">
          {notification.type === 'success' && <Check className="w-4 h-4 text-emerald-400 flex-none" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-none" />}
          {notification.type === 'info' && <Database className="w-4 h-4 text-sky-400 flex-none" />}
          <span className="leading-tight">{notification.message}</span>
        </div>
      )}

      {/* Modern Header Banner */}
      <header className="bg-white border-b border-slate-100 py-6 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all duration-300">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                Employee Calorie Dashboard
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sistem Pemantauan Energi, Kalori, dan Aktivasi Akun Karyawan
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2.5">
            {isCustomSource ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-100 text-xs font-semibold shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>Terhubung ke Google Sheet (Live)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-100 text-xs font-semibold shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>Mode Offline (Data Contoh)</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Google Sheet Connection Manager Card */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            {/* Info and Status */}
            <div className="space-y-1.5 max-w-xl">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Sumber Data Google Sheet (via Google Apps Script)
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ambil data karyawan secara real-time dari spreadsheet Anda sendiri! Pastikan Anda sudah membuat Web App Google Apps Script dari panduan di bagian bawah halaman ini.
              </p>
              {connection.lastFetched && (
                <p className="text-[10px] text-emerald-600 font-mono font-medium">
                  ✓ Terakhir diperbarui: {connection.lastFetched} WIB
                </p>
              )}
            </div>

            {/* Input Form & Controls */}
            <div className="flex-1 max-w-2xl w-full">
              <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="Masukkan URL Web App Apps Script Anda..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-2xl text-xs text-slate-700 bg-slate-50/50 transition-all font-mono"
                  />
                </div>
                
                <div className="flex gap-2">
                  {connection.isConnected ? (
                    <>
                      <button
                        type="button"
                        onClick={() => fetchLiveEmployees(sheetUrl)}
                        disabled={connection.isLoading}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors cursor-pointer"
                        title="Perbarui Data"
                      >
                        <RefreshCw className={`w-4 h-4 ${connection.isLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold border border-rose-100 transition-colors cursor-pointer flex-1 sm:flex-initial text-center"
                      >
                        Putuskan
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      disabled={connection.isLoading}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                    >
                      {connection.isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menghubungkan...</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Hubungkan</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
              
              {connection.error && (
                <p className="text-[11px] text-rose-600 mt-2 flex items-start gap-1 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-100 leading-normal">
                  <AlertCircle className="w-3.5 h-3.5 flex-none mt-0.5" />
                  <span>{connection.error}</span>
                </p>
              )}
            </div>

          </div>
        </section>

        {/* TOP LEVEL METRIC CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Karyawan"
            value={stats.totalEmployees}
            subValue={`${stats.activeEmployees} akun diaktifkan`}
            icon={<Users className="w-6 h-6" />}
            colorClass="text-indigo-600"
            bgClass="bg-indigo-50"
          />

          <MetricCard
            title="Karyawan Aktif"
            value={`${stats.activeEmployees} staf`}
            subValue={`Rasio keaktifan: ${stats.totalEmployees > 0 ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0}%`}
            icon={<CheckCircle className="w-6 h-6" />}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
          />

          <MetricCard
            title="Total Kalori"
            value={`${stats.totalCalories.toLocaleString('id-ID')} kcal`}
            subValue="Konsumsi total energi"
            icon={<Flame className="w-6 h-6" />}
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
          />

          <MetricCard
            title="Rata-rata Kalori"
            value={`${stats.avgCalories.toLocaleString('id-ID')} kcal`}
            subValue={stats.maxCaloriesEmployee ? `Tertinggi: ${stats.maxCaloriesEmployee.name}` : undefined}
            icon={<TrendingUp className="w-6 h-6" />}
            colorClass="text-rose-600"
            bgClass="bg-rose-50"
          />
        </section>

        {/* CUSTOM INTERACTIVE CHARTS AND DISTRIBUTION */}
        <section className="space-y-6">
          <Charts
            employees={employees}
            selectedDirektorat={selectedDirektorat}
            setSelectedDirektorat={setSelectedDirektorat}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
          />
        </section>

        {/* MAIN DATA TABLES & ACTION WRAPPER */}
        <section className="space-y-4">
          <EmployeeTable
            employees={employees}
            selectedDirektorat={selectedDirektorat}
            setSelectedDirektorat={setSelectedDirektorat}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            onAddEmployeeClick={() => setIsAddModalOpen(true)}
            onDeleteEmployee={handleDeleteEmployee}
            isCustomSource={isCustomSource}
          />
        </section>

        {/* GUIDE & GOOGLE APPS SCRIPT MANIFESTO SECTION */}
        <section className="pt-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 overflow-hidden">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between px-3 py-2 text-slate-800 hover:text-emerald-700 font-bold transition-colors cursor-pointer text-sm"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <span>Butuh Bantuan? Lihat Panduan Pembuatan Google Sheets & Apps Script</span>
              </div>
              <div>
                {showInstructions ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
            
            {showInstructions && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Instructions />
              </div>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center text-slate-400 text-xs border-t border-slate-100 pt-8">
        <p>© 2026 Employee Calorie Dashboard. Semua data disimpan secara aman dalam sistem integrasi Anda.</p>
        <p className="mt-1">Dibuat menggunakan teknologi web modern dengan koneksi langsung Google Apps Script API.</p>
      </footer>

      {/* POPUP MODAL FOR ADDING EMPLOYEE */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddEmployee}
        existingDirektorat={uniqueDirektorat.length > 0 ? uniqueDirektorat : ['EPM - ABM & STAFF', 'EPM - ACCOUNTING', 'EPM - CFD', 'EPM - CHB 1', 'EPM - CHD']}
      />

    </div>
  );
}
