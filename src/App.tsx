import React, { useState, useEffect, useMemo } from 'react';
import { Employee, DashboardStats, SheetIntegration } from './types';
import { SAMPLE_EMPLOYEES } from './data/sampleData';
import MetricCard from './components/MetricCard';
import Charts from './components/Charts';
import EmployeeTable from './components/EmployeeTable';
import AddEmployeeModal from './components/AddEmployeeModal';
import Instructions from './components/Instructions';
import donorKaloriLogo from './assets/images/donor_kalori_logo_1784286541228.jpg';
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
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  Trophy,
  Lock,
  User,
  LogOut,
  Heart
} from 'lucide-react';

export default function App() {
  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('donor_kalori_logged_in') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

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

  // Config Visibility State
  const [showSourceConfig, setShowSourceConfig] = useState(() => {
    return localStorage.getItem('show_source_config') !== 'false';
  });

  // Auto Refresh States
  const [isAutoRefresh, setIsAutoRefresh] = useState(() => {
    return localStorage.getItem('auto_refresh_enabled') === 'true';
  });
  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem('auto_refresh_interval');
    return saved ? Number(saved) : 30000;
  });

  // UI States
  const [selectedDirektorat, setSelectedDirektorat] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'Activated' | 'Not Activated' | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Persistent Auto Refresh state changes
  useEffect(() => {
    localStorage.setItem('auto_refresh_enabled', String(isAutoRefresh));
  }, [isAutoRefresh]);

  useEffect(() => {
    localStorage.setItem('auto_refresh_interval', String(refreshInterval));
  }, [refreshInterval]);

  useEffect(() => {
    localStorage.setItem('show_source_config', String(showSourceConfig));
  }, [showSourceConfig]);

  // Auto Refresh Interval hook
  useEffect(() => {
    if (!isAutoRefresh || !connection.isConnected || !connection.url) return;

    const intervalId = setInterval(() => {
      if (!connection.isLoading) {
        fetchLiveEmployees(connection.url, true); // true for silent update
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [isAutoRefresh, connection.isConnected, connection.url, refreshInterval]);

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

  // Authentication Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError(null);

    setTimeout(() => {
      const email = loginEmail.trim().toLowerCase();
      const password = loginPassword;

      if (email === 'admin@enseval.com' && password === 'burnforgood2026') {
        setIsLoggedIn(true);
        localStorage.setItem('donor_kalori_logged_in', 'true');
        showToast('success', 'Selamat datang kembali! Login berhasil.');
      } else {
        setLoginError('Alamat email atau kata sandi salah. Silakan periksa kembali kredensial Anda.');
      }
      setIsLoginLoading(false);
    }, 800);
  };

  const handleQuickLogin = () => {
    setIsLoginLoading(true);
    setLoginError(null);
    setLoginEmail('admin@enseval.com');
    setLoginPassword('burnforgood2026');

    setTimeout(() => {
      setIsLoggedIn(true);
      localStorage.setItem('donor_kalori_logged_in', 'true');
      showToast('success', 'Selamat datang! Login demo berhasil.');
      setIsLoginLoading(false);
    }, 600);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('donor_kalori_logged_in');
    setLoginEmail('');
    setLoginPassword('');
    showToast('info', 'Anda telah berhasil keluar dari sistem.');
  };

  // FETCH Data from Google Sheet Apps Script
  const fetchLiveEmployees = async (urlToFetch: string, isSilent = false) => {
    if (!urlToFetch) return;
    
    setConnection(prev => ({ ...prev, isLoading: true, error: null }));
    if (!isSilent) {
      showToast('info', 'Sedang mengambil data dari Google Sheet...');
    }

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
        if (!isSilent) {
          showToast('success', `Berhasil memuat ${result.data.length} karyawan dari Google Sheet!`);
        }
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white font-sans">
        {/* Toast Notification Banner */}
        {notification && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-800 text-xs font-semibold animate-bounce">
            {notification.type === 'success' && <Check className="w-4 h-4 text-emerald-400 flex-none" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-none" />}
            {notification.type === 'info' && <Database className="w-4 h-4 text-sky-400 flex-none" />}
            <span className="leading-tight">{notification.message}</span>
          </div>
        )}

        {/* Glowing background shapes for depth */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Login Container */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-8 space-y-6 transition-all duration-300">
          
          {/* Logo and Headings */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 bg-white rounded-3xl overflow-hidden flex items-center justify-center shadow-lg border border-slate-100 p-0.5 group-hover:scale-105 transition-transform duration-300">
              <img 
                src={donorKaloriLogo} 
                alt="Donor Kalori Logo" 
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
                Donor Kalori 2026
              </h1>
              <p className="text-xs font-semibold text-emerald-600 tracking-wider uppercase">
                BURN FOR GOOD • ENSEVAL BEKASI
              </p>
            </div>
            <div className="h-px bg-slate-100 w-24 mx-auto" />
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              Silakan login untuk memantau data donor energi, kalori, dan aktivasi akun karyawan secara real-time.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-semibold leading-normal">{loginError}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Alamat Email / Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  placeholder="Masukkan email atau username..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none rounded-2xl text-xs text-slate-800 bg-slate-50/50 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-11 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none rounded-2xl text-xs text-slate-800 bg-slate-50/50 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoginLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoginLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>



        </div>

        {/* Footer / Copyright info */}
        <p className="text-[10px] text-slate-400/80 mt-6 font-medium text-center leading-relaxed flex flex-col items-center gap-1.5">
          <span>© 2026 PT Enseval Putera Megatrading Tbk - Cabang Bekasi.</span>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shadow-sm inline-flex items-center gap-1">
            Created by : ©Jordan Nur Akbar
          </span>
          <span>Sistem Pendonor Energi & Kalori Terintegrasi.</span>
        </p>
      </div>
    );
  }

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
            <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300 animate-pulse">
              <img 
                src={donorKaloriLogo} 
                alt="Donor Kalori Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                Dashboard Donor Kalori 2026 Enseval Bekasi
              </h1>
              <p className="text-xs font-bold text-emerald-600 tracking-wider">
                BURN FOR GOOD !
              </p>
            </div>
          </div>

          {/* Connection Status Badge & Toggle Settings */}
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

            <button
              onClick={() => setShowSourceConfig(!showSourceConfig)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                showSourceConfig 
                  ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800' 
                  : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
              }`}
              title={showSourceConfig ? 'Sembunyikan Pengaturan Google Sheet' : 'Tampilkan Pengaturan Google Sheet'}
            >
              {showSourceConfig ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sembunyikan Panel</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Sumber Data</span>
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 transition-all cursor-pointer shadow-sm"
              title="Keluar dari Sistem"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Google Sheet Connection Manager Card */}
        {showSourceConfig && (
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              
              {/* Info and Status */}
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Sumber Data Google Sheet (via Google Apps Script)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowSourceConfig(false)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                    title="Sembunyikan Panel"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Sembunyikan</span>
                  </button>
                </div>
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

                {connection.isConnected && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isAutoRefresh ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isAutoRefresh ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        Auto Refresh {isAutoRefresh ? 'Aktif' : 'Nonaktif'}
                        {isAutoRefresh && (
                          <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                        )}
                      </span>
                    </div>

                    {isAutoRefresh && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Interval:
                        </span>
                        <select
                          value={refreshInterval}
                          onChange={(e) => setRefreshInterval(Number(e.target.value))}
                          className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-semibold py-1 px-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                          <option value={10000}>10 Detik</option>
                          <option value={30000}>30 Detik</option>
                          <option value={60000}>1 Menit</option>
                          <option value={300000}>5 Menit</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </section>
        )}

        {/* TOP LEVEL METRIC CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
            subValue="Rata-rata per karyawan"
            icon={<TrendingUp className="w-6 h-6" />}
            colorClass="text-rose-600"
            bgClass="bg-rose-50"
          />

          <MetricCard
            title="Most Burn Calories!"
            value={stats.maxCaloriesEmployee ? stats.maxCaloriesEmployee.name : '-'}
            subValue={stats.maxCaloriesEmployee ? `${stats.maxCaloriesEmployee.kalori.toLocaleString('id-ID')} kcal • ${stats.maxCaloriesEmployee.direktorat}` : undefined}
            icon={<Trophy className="w-6 h-6" />}
            colorClass="text-amber-500"
            bgClass="bg-amber-50"
            isHighlighted={true}
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
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center text-slate-400 text-xs border-t border-slate-100 pt-8 flex flex-col items-center gap-2">
        <p>© 2026 PT Enseval Putera Megatrading Tbk - Cabang Bekasi.</p>
        <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-sm inline-flex items-center gap-1">
          Created by : ©Jordan Nur Akbar
        </p>
        <p className="text-[11px] text-slate-400">Sistem Pendonor Energi & Kalori Terintegrasi • Koneksi Google Apps Script API.</p>
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
