import React, { useState } from 'react';
import { Copy, Check, ExternalLink, ShieldCheck, HelpCircle, FileText, Settings, Play } from 'lucide-react';

export default function Instructions() {
  const [copied, setCopied] = useState(false);

  const gasCode = `/**
 * GOOGLE APPS SCRIPT - API DASHBOARD KALORI KARYAWAN
 * 
 * Tempelkan kode ini di Google Sheets Anda:
 * Alat/Ekstensi -> Apps Script
 */

function doGet(e) {
  var output = {};
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var range = sheet.getDataRange();
    var values = range.getValues();
    
    // Jika sheet kosong atau belum diisi (hanya sel kosong pertama), inisialisasi header secara otomatis
    if (values.length === 0 || (values.length === 1 && values[0][0].toString().trim() === "")) {
      var defaultHeaders = ["NIK", "Employee Name", "Direktorat", "Status", "Jumlah Total Kalori"];
      sheet.appendRow(defaultHeaders);
      return createJsonResponse({ status: "success", data: [] });
    }
    
    // Jika sheet hanya berisi satu baris (hanya header saja), itu bukan error melainkan tabel kosong
    if (values.length === 1) {
      return createJsonResponse({ status: "success", data: [] });
    }
    
    // Parsing headers ke lowercase untuk normalisasi
    var headers = values[0].map(function(h) { 
      return h.toString().trim().toLowerCase(); 
    });
    
    var data = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var record = {};
      
      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        var val = row[j];
        
        if (header === 'nik') {
          record.nik = val.toString().trim();
        } else if (header === 'employee name' || header === 'nama' || header === 'employee_name') {
          record.name = val.toString().trim();
        } else if (header === 'direktorat') {
          record.direktorat = val.toString().trim();
        } else if (header === 'status') {
          record.status = val.toString().trim();
        } else if (header === 'jumlah total kalori' || header === 'kalori' || header === 'calories' || header === 'jumlah_total_kalori') {
          record.kalori = isNaN(Number(val)) ? 0 : Number(val);
        } else {
          var key = header.replace(/\s+/g, '_');
          record[key] = val;
        }
      }
      
      // Fallback & Validasi
      if (record.nik) {
        if (!record.name) record.name = "Tanpa Nama";
        if (!record.direktorat) record.direktorat = "EPM - STAFF";
        if (!record.status) record.status = "Activated";
        if (record.kalori === undefined) record.kalori = 0;
        data.push(record);
      }
    }
    
    output = { status: "success", data: data };
  } catch (err) {
    output = { status: "error", message: err.toString() };
  }
  return createJsonResponse(output);
}

function doPost(e) {
  var output = {};
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var postData;
    
    // GAS terkadang melewatkan payload dalam postData.contents atau parameter biasa
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      postData = e.parameter;
    }
    
    if (!postData.nik || !postData.name) {
      return createJsonResponse({ status: "error", message: "Parameter 'nik' dan 'name' wajib diisi." });
    }
    
    var values = sheet.getDataRange().getValues();
    // Jika sheet kosong, tulis header terlebih dahulu
    if (values.length === 0 || (values.length === 1 && values[0][0].toString().trim() === "")) {
      var defaultHeaders = ["NIK", "Employee Name", "Direktorat", "Status", "Jumlah Total Kalori"];
      sheet.appendRow(defaultHeaders);
      values = sheet.getDataRange().getValues();
    }
    
    var headers = values[0].map(function(h) { 
      return h.toString().trim().toLowerCase(); 
    });
    
    // Buat baris baru berdasarkan posisi header
    var newRow = new Array(headers.length);
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      if (h === 'nik') newRow[i] = postData.nik.toString();
      else if (h === 'employee name' || h === 'nama' || h === 'employee_name') newRow[i] = postData.name;
      else if (h === 'direktorat') newRow[i] = postData.direktorat || 'EPM - STAFF';
      else if (h === 'status') newRow[i] = postData.status || 'Activated';
      else if (h === 'jumlah total kalori' || h === 'kalori' || h === 'calories' || h === 'jumlah_total_kalori') newRow[i] = Number(postData.kalori || 0);
      else newRow[i] = "";
    }
    
    sheet.appendRow(newRow);
    output = { status: "success", message: "Data karyawan " + postData.name + " berhasil ditambahkan!" };
  } catch (err) {
    output = { status: "error", message: err.toString() };
  }
  return createJsonResponse(output);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(gasCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="instructions-container" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden transition-all duration-300">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Integrasi Google Sheets & Apps Script</h2>
          <p className="text-xs text-slate-500">Hubungkan dashboard Anda langsung ke spreadsheet real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step List */}
        <div className="lg:col-span-5 space-y-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Langkah Setup</h3>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-none flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mt-0.5">
                1
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  Buat Google Sheet Baru
                  <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-600 inline-flex items-center">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Buat baris pertama sebagai header dengan kolom persis: <br />
                  <span className="font-mono bg-slate-50 border border-slate-100 px-1 py-0.5 rounded text-emerald-600 text-[10px]">
                    NIK | Employee Name | Direktorat | Status | Jumlah Total Kalori
                  </span>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-none flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mt-0.5">
                2
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-800">Buka Google Apps Script</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Di menu atas Google Sheets, klik <span className="font-medium text-slate-700">Ekstensi</span> &gt; <span className="font-medium text-slate-700">Apps Script</span>. Hapus semua kode bawaan yang ada.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-none flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mt-0.5">
                3
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-800">Salin & Tempel Kode</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Salin kode Apps Script di samping kanan dan tempelkan ke editor Apps Script Anda. Klik tombol simpan (ikon disket).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-none flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mt-0.5">
                4
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-800">Terapkan Sebagai Web App</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Klik tombol <span className="font-medium text-slate-700">Terapkan (Deploy)</span> &gt; <span className="font-medium text-slate-700">Terapkan baru (New deployment)</span>.
                  Pilih tipe <span className="font-semibold text-slate-700">Aplikasi Web (Web App)</span>.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="flex-none flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mt-0.5">
                5
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-800">Atur Izin Akses (PENTING!)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Ubah bagian <span className="font-semibold text-slate-700">"Yang memiliki akses" (Who has access)</span> menjadi <span className="font-semibold text-emerald-600">"Siapa saja" (Anyone)</span>. Klik Terapkan dan setujui izin jika diminta.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="flex gap-4">
              <div className="flex-none flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mt-0.5">
                6
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-800">Salin Web App URL</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Salin URL Aplikasi Web yang diberikan (panjang dan diakhiri dengan <span className="font-mono bg-slate-50 px-1 rounded">/exec</span>), lalu tempelkan ke input di atas dashboard ini.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 flex items-start gap-3 mt-4">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-none mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Tips CORS & Pengiriman Data:</span> Kode di samping sudah dilengkapi CORS header khusus agar browser diizinkan membaca data. Ketika melakukan penambahan data (POST) dari web, kami mengirimkan dalam format teks ter-serialize untuk menjamin kompatibilitas bypass CORS.
            </div>
          </div>
        </div>

        {/* Code Container */}
        <div className="lg:col-span-7 flex flex-col h-[520px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-slate-400 font-mono ml-2">code.js (Google Apps Script)</span>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-slate-300">
            <pre className="whitespace-pre">{gasCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
