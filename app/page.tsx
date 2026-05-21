"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import JSZip from "jszip";
import {
  LayoutDashboard, Tag, Upload, Search, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, ZoomIn, ZoomOut, SkipForward,
  Save, FileDown, Info, Keyboard, RotateCcw, RotateCw, Package,
  LogOut, Users, AlertCircle, Mail, Lock, Eye, EyeOff,
  Trash2, Pencil, X, RefreshCw,
} from "lucide-react";
import { supabase, OcrLabel } from "@/lib/supabase";

const BUCKET_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ocr-crops`;

const CLASS_META: Record<string, { dot: string; label: string }> = {
  nama_toko:     { dot: "bg-blue-500",    label: "Nama Toko" },
  line_item:     { dot: "bg-emerald-500", label: "Line Item" },
  tanggal_waktu: { dot: "bg-amber-500",   label: "Tgl/Waktu" },
  total_belanja: { dot: "bg-rose-500",    label: "Total" },
};

const BATCH_PRESETS = [20, 50, 100];

type Phase = "auth" | "labeling";

/* ─── Toast ─── */
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2
      ${type === "success" ? "bg-gray-900 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {message}
    </div>
  );
}

/* ─── Stat card ─── */
function StatCard({ label, value, sub, icon: Icon }: {
  label: string; value: number | string; sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <Icon size={16} className="text-gray-500" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   SCREEN 0 — Autentikasi
════════════════════════════════════════════════════════ */
function AuthScreen({ onAuth }: { onAuth: (email: string) => void }) {
  const [tab, setTab]         = useState<"signin" | "signup">("signin");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [info, setInfo]       = useState("");

  const submit = async () => {
    if (!email.trim() || !password) { setError("Email dan password wajib diisi."); return; }
    setLoading(true);
    setError("");
    setInfo("");

    if (tab === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) { setError(err.message); setLoading(false); return; }
      onAuth(email.trim());
    } else {
      const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) { setError(err.message); setLoading(false); return; }
      setInfo("Akun dibuat! Cek email untuk konfirmasi, lalu login.");
      setTab("signin");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto">N</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NotePay OCR Labeling</h1>
            <p className="text-sm text-gray-500 mt-1">Masuk untuk mulai sesi labeling</p>
          </div>
        </div>

        {/* Tab */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(["signin", "signup"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); setInfo(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors
                ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "signin" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {/* Email */}
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="email"
              placeholder="Email..."
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900
                bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-900
                bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
            />
            <button onClick={() => setShowPw(v => !v)} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </p>
          )}
          {info && (
            <p className="text-xs text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 size={12} /> {info}
            </p>
          )}
        </div>

        <button onClick={submit} disabled={loading}
          className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800
            disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
            : tab === "signin" ? "Masuk →" : "Buat Akun →"
          }
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   SCREEN 1 — Labeling (main app)
════════════════════════════════════════════════════════ */
function LabelingScreen({
  name, onSignOut,
}: {
  name: string;
  onSignOut: () => void;
}) {
  const [rows, setRows]           = useState<OcrLabel[]>([]);
  const [index, setIndex]         = useState(0);
  const [inputLabel, setInput]    = useState("");
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [stats, setStats]         = useState({ total: 0, verified: 0, by_class: {} as Record<string, number>, verified_by_class: {} as Record<string, number> });
  const [labelers, setLabelers]   = useState<{ name: string; count: number }[]>([]);
  const [unassigned, setUnassigned] = useState<number | null>(null);
  const [claimCount, setClaimCount] = useState<number | "">(20);
  const [claiming, setClaiming]   = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation]   = useState(0);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [releasing, setReleasing] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportRows, setExportRows] = useState<OcrLabel[] | null>(null);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; phase: "fetching" | "zipping" } | null>(null);
  const [verifiedRows, setVerifiedRows]   = useState<OcrLabel[] | null>(null);
  const [verifiedLoading, setVerifiedLoading] = useState(false);
  const [editingRow, setEditingRow]       = useState<OcrLabel | null>(null);
  const [editLabel, setEditLabel]         = useState("");
  const [editSaving, setEditSaving]       = useState(false);
  const [verifiedPage, setVerifiedPage]   = useState(1);
  const VERIFIED_PAGE_SIZE = 20;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [batchTotal, setBatchTotal] = useState(0);
  const batchDone      = batchTotal - rows.length;
  const batchPct       = batchTotal > 0 ? Math.round((batchDone / batchTotal) * 100) : 0;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  const fetchGlobalStats = useCallback(async () => {
    const classes = Object.keys(CLASS_META);

    // Semua count query paralel — tidak tarik data, hanya angka dari DB
    const [
      { count: total },
      { count: verified },
      { count: unassignedCount },
      ...perClassCounts
    ] = await Promise.all([
      supabase.from("ocr_labels").select("*", { count: "exact", head: true }),
      supabase.from("ocr_labels").select("*", { count: "exact", head: true }).eq("verified", true),
      supabase.from("ocr_labels").select("*", { count: "exact", head: true }).eq("verified", false).is("assigned_to", null),
      // per kelas: [total, verified] × 4 kelas = 8 query
      ...classes.flatMap(cls => [
        supabase.from("ocr_labels").select("*", { count: "exact", head: true }).eq("class", cls),
        supabase.from("ocr_labels").select("*", { count: "exact", head: true }).eq("class", cls).eq("verified", true),
      ]),
    ]);

    const by_class: Record<string, number> = {};
    const verified_by_class: Record<string, number> = {};
    classes.forEach((cls, i) => {
      by_class[cls]          = perClassCounts[i * 2]?.count     ?? 0;
      verified_by_class[cls] = perClassCounts[i * 2 + 1]?.count ?? 0;
    });

    setStats({ total: total ?? 0, verified: verified ?? 0, by_class, verified_by_class });
    setUnassigned(unassignedCount ?? 0);

    // Labeler aktif: ambil assigned_to yang belum verified (max 1000 cukup untuk daftar nama)
    const { data: activeData } = await supabase
      .from("ocr_labels").select("assigned_to").eq("verified", false).not("assigned_to", "is", null);
    const counts: Record<string, number> = {};
    (activeData ?? []).forEach(r => { if (r.assigned_to) counts[r.assigned_to] = (counts[r.assigned_to] ?? 0) + 1; });
    setLabelers(Object.entries(counts).map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count));
  }, []);

  // Restore batch yang sudah di-claim setelah reload
  useEffect(() => {
    if (!name) return;
    supabase
      .from("ocr_labels")
      .select("*")
      .eq("assigned_to", name)
      .eq("verified", false)
      .order("id")
      .then(({ data }) => {
        if (data?.length) {
          setRows(data);
          setBatchTotal(t => Math.max(t, data.length));
          setActiveNav("labeling");
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => { fetchGlobalStats(); }, [fetchGlobalStats]);
  useEffect(() => {
    if (rows[index]) setInput(rows[index].label ?? "");
    setZoomLevel(1);
    setRotation(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [index, rows]);

  const current = rows[index];

  const save = async (markVerified: boolean) => {
    if (!current || saving) return;
    setSaving(true);
    const { error } = await supabase.from("ocr_labels").update({
      label:      inputLabel.trim(),
      verified:   markVerified,
      updated_at: new Date().toISOString(),
      updated_by: name,
    }).eq("id", current.id);
    setSaving(false);
    if (error) { showToast("Gagal menyimpan", "error"); return; }
    showToast(markVerified ? "Terverifikasi" : "Tersimpan");
    fetchGlobalStats();
    if (markVerified) {
      const next = rows.filter((_, i) => i !== index);
      setRows(next);
      setIndex(Math.min(index, Math.max(0, next.length - 1)));
    }
  };

  const releaseBatch = async () => {
    setReleasing(true);
    const remaining = rows.filter(r => !r.verified);
    if (remaining.length > 0) {
      await supabase
        .from("ocr_labels")
        .update({ assigned_to: null, assigned_at: null })
        .in("id", remaining.map(r => r.id));
    }
    setRows([]);
    setBatchTotal(0);
    setIndex(0);
    setReleasing(false);
    fetchGlobalStats();
    setActiveNav("dashboard");
  };

  const claimMore = async () => {
    const n = Number(claimCount);
    if (!n || n < 1) { showToast("Masukkan jumlah yang valid", "error"); return; }
    if (unassigned !== null && n > unassigned) {
      showToast(`Hanya tersisa ${unassigned} gambar`, "error"); return;
    }
    setClaiming(true);
    const { data: toAssign } = await supabase
      .from("ocr_labels").select("id")
      .eq("verified", false).is("assigned_to", null)
      .order("id").limit(n);
    if (!toAssign?.length) { showToast("Tidak ada gambar tersisa", "error"); setClaiming(false); return; }
    const ids = toAssign.map(r => r.id);
    await supabase.from("ocr_labels")
      .update({ assigned_to: name, assigned_at: new Date().toISOString() })
      .in("id", ids);
    const { data: claimed } = await supabase.from("ocr_labels").select("*").in("id", ids).order("id");
    if (claimed?.length) {
      setRows(prev => {
        const next = [...prev, ...claimed];
        setBatchTotal(t => t + claimed.length);
        return next;
      });
      showToast(`${claimed.length} gambar ditambahkan ke batch`);
    }
    setClaiming(false);
    fetchGlobalStats();
    setActiveNav("labeling");
  };

  const deleteEntry = async () => {
    if (!current || deleting) return;
    if (!confirm(`Hapus "${current.filename}" secara permanen dari storage dan database?`)) return;
    setDeleting(true);
    await Promise.all([
      supabase.storage.from("ocr-crops").remove([current.filename]),
      supabase.from("ocr_labels").delete().eq("id", current.id),
    ]);
    const next = rows.filter((_, i) => i !== index);
    setRows(next);
    setIndex(Math.min(index, Math.max(0, next.length - 1)));
    setDeleting(false);
    fetchGlobalStats();
    showToast("Entry dihapus");
  };

  const loadVerified = useCallback(async () => {
    setVerifiedLoading(true);
    const { data } = await supabase
      .from("ocr_labels").select("*").eq("verified", true).order("updated_at", { ascending: false });
    setVerifiedRows(data ?? []);
    setVerifiedLoading(false);
  }, []);

  useEffect(() => {
    if (activeNav === "edit") { loadVerified(); setVerifiedPage(1); }
  }, [activeNav, loadVerified]);

  const saveEditVerified = async () => {
    if (!editingRow || editSaving) return;
    setEditSaving(true);
    await supabase.from("ocr_labels").update({
      label: editLabel.trim(),
      updated_at: new Date().toISOString(),
      updated_by: name,
    }).eq("id", editingRow.id);
    setVerifiedRows(prev => prev?.map(r => r.id === editingRow.id ? { ...r, label: editLabel.trim() } : r) ?? null);
    setEditSaving(false);
    setEditingRow(null);
    showToast("Label diperbarui");
    fetchGlobalStats();
  };

  const unverify = async (row: OcrLabel) => {
    await supabase.from("ocr_labels").update({
      verified: false,
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);
    setVerifiedRows(prev => prev?.filter(r => r.id !== row.id) ?? null);
    fetchGlobalStats();
    showToast("Di-unverify, masuk ke antrian");
  };

  const deleteVerified = async (row: OcrLabel) => {
    if (!confirm(`Hapus "${row.filename}" secara permanen?`)) return;
    await Promise.all([
      supabase.storage.from("ocr-crops").remove([row.filename]),
      supabase.from("ocr_labels").delete().eq("id", row.id),
    ]);
    setVerifiedRows(prev => prev?.filter(r => r.id !== row.id) ?? null);
    fetchGlobalStats();
    showToast("Entry dihapus");
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const exportCSV = async (cls?: string) => {
    setExporting(true);
    let q = supabase.from("ocr_labels").select("*").eq("verified", true);
    if (cls) q = q.eq("class", cls);
    const { data } = await q;
    setExporting(false);
    if (!data?.length) { showToast("Belum ada data verified", "error"); return; }
    const headers = ["filepath", "label", "class"];
    const csv = [
      headers.join(","),
      ...data.map(r => {
        const basename = r.filename.split("/").pop() ?? r.filename;
        const fp = `${r.class}/${basename}`;
        return `"${fp}","${(r.label ?? "").replace(/"/g, '""')}","${r.class}"`;
      }),
    ].join("\n");
    triggerDownload(new Blob([csv], { type: "text/csv" }), cls ? `ocr_${cls}.csv` : "ocr_labels.csv");
    showToast(`${data.length} baris diexport`);
  };

  const exportZIP = async (cls?: string) => {
    if (zipProgress) return;
    let q = supabase.from("ocr_labels").select("*").eq("verified", true);
    if (cls) q = q.eq("class", cls);
    const { data } = await q;
    if (!data?.length) { showToast("Belum ada data verified", "error"); return; }

    const date = new Date().toISOString().slice(0, 10);
    const zipName = cls ? `ocr_${cls}_${date}` : `ocr_dataset_${date}`;
    const zip = new JSZip();
    const csvRows = ["filepath,label,class"];
    const total = data.length;
    setZipProgress({ current: 0, total, phase: "fetching" });

    const CONCURRENCY = 6;
    let completed = 0;
    for (let i = 0; i < data.length; i += CONCURRENCY) {
      const batch = data.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (row) => {
        try {
          const res = await fetch(`${BUCKET_URL}/${row.filename}`);
          const blob = await res.blob();
          const basename = row.filename.split("/").pop() ?? row.filename;
          const zipPath = `${zipName}/${row.class}/${basename}`;
          zip.file(zipPath, blob);
          csvRows.push(`"${row.class}/${basename}","${(row.label ?? "").replace(/"/g, '""')}","${row.class}"`);
        } catch {
          csvRows.push(`"${row.filename}","${(row.label ?? "").replace(/"/g, '""')}","${row.class}"`);
        }
        completed++;
        setZipProgress({ current: completed, total, phase: "fetching" });
      }));
    }

    zip.file(`${zipName}/labels.csv`, csvRows.join("\n"));
    setZipProgress({ current: total, total, phase: "zipping" });

    const blob = await zip.generateAsync(
      { type: "blob", compression: "DEFLATE", compressionOptions: { level: 3 } },
    );
    triggerDownload(blob, `${zipName}.zip`);
    setZipProgress(null);
    showToast(`${total} gambar + label dikemas dalam ZIP`);
  };

  const loadExportPreview = useCallback(async () => {
    const { data } = await supabase.from("ocr_labels").select("*").eq("verified", true).order("id").limit(10);
    setExportRows(data ?? []);
  }, []);

  useEffect(() => {
    if (activeNav === "export") { fetchGlobalStats(); loadExportPreview(); }
  }, [activeNav, fetchGlobalStats, loadExportPreview]);

  const goNext = () => setIndex(i => Math.min(rows.length - 1, i + 1));
  const goPrev = () => setIndex(i => Math.max(0, i - 1));

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "labeling",  icon: Tag,             label: "Labeling"  },
    { id: "edit",      icon: Pencil,          label: "Edit Verified" },
    { id: "export",    icon: Upload,          label: "Export"    },
  ];

  /* ── header title per nav ── */
  const headerTitle = activeNav === "dashboard" ? "Dashboard"
    : activeNav === "export" ? "Export Dataset"
    : activeNav === "edit"   ? "Edit Data Verified"
    : `Selamat datang, ${name}!`;
  const headerSub = activeNav === "dashboard" ? "Statistik progress labeling tim"
    : activeNav === "export" ? "Download dataset OCR yang sudah diverifikasi"
    : activeNav === "edit"   ? "Koreksi atau hapus data yang sudah terverifikasi"
    : "Verifikasi label OCR dataset struk belanja";

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {toast && <Toast {...toast} />}

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">

        {/* Fixed: logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-gray-200 shrink-0">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white text-sm font-bold select-none">N</div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">NotePay</p>
            <p className="text-xs text-gray-500 mt-0.5">OCR Labeling Tool</p>
          </div>
        </div>

        {/* Scrollable middle */}
        <div className="flex-1 overflow-y-auto">

          {/* Nama & batch info */}
          <div className="px-4 pt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                <p className="text-xs text-gray-500">Batch: {batchDone}/{batchTotal}</p>
              </div>
            </div>
          </div>

          {/* Batch progress */}
          <div className="px-4 pt-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress batch</span>
                <span className="font-semibold text-gray-900">{batchPct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: `${batchPct}%` }} />
              </div>
              <p className="text-xs text-gray-400">{rows.length} sisa di batch kamu</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 pt-4 space-y-0.5">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button key={id}
                onClick={() => setActiveNav(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
                  ${activeNav === id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </nav>

          {/* Kelas */}
          <div className="px-3 pt-5">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Kelas</p>
            {Object.entries(CLASS_META).map(([cls, meta]) => (
              <div key={cls} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500">
                <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                <span className="flex-1 text-xs">{meta.label}</span>
                <span className="text-xs text-gray-400 tabular-nums">{stats.by_class[cls] ?? 0}</span>
              </div>
            ))}
          </div>

          {/* Shortcut */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Keyboard size={12} className="text-gray-400" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shortcut</p>
            </div>
            <div className="space-y-2">
              {[["Enter", "Verify & Next"], ["Esc", "Skip"], ["Ctrl+←/→", "Nav"]].map(([k, d]) => (
                <div key={k} className="flex items-center justify-between">
                  <kbd className="bg-gray-100 border border-gray-200 text-gray-700 text-[11px] px-2 py-0.5 rounded-lg font-mono">{k}</kbd>
                  <span className="text-xs text-gray-500">{d}</span>
                </div>
              ))}
            </div>
          </div>

        </div>{/* end scrollable */}

        {/* Fixed: footer */}
        <div className="px-4 pb-5 pt-3 border-t border-gray-200 space-y-2 shrink-0">
          <button onClick={releaseBatch} disabled={releasing}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200
              text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 transition-colors">
            <LogOut size={13} />
            {releasing ? "Melepas..." : "Lepas sisa batch"}
          </button>
          <p className="text-[10px] text-gray-400 text-center">Gambar yang belum selesai akan dikembalikan</p>
          <button onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-gray-400
              hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={12} /> Keluar akun
          </button>
        </div>

      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 h-16 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-bold text-gray-900">{headerTitle}</h1>
            <p className="text-xs text-gray-500">{headerSub}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveNav("export")}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <FileDown size={14} /> Export
            </button>
            {activeNav === "labeling" && (
              <button onClick={() => save(true)} disabled={saving || !current}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <CheckCircle2 size={14} />
                {saving ? "Menyimpan..." : "Verify"}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          {/* ══ DASHBOARD ══ */}
          {activeNav === "dashboard" && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <StatCard icon={Package}      label="Total Gambar"    value={stats.total}    sub="dalam dataset" />
                <StatCard icon={CheckCircle2} label="Sudah Verified"  value={stats.verified} sub={`${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% selesai`} />
                <StatCard icon={Clock}        label="Belum Verified"  value={stats.total - stats.verified} sub="menunggu label" />
                <StatCard icon={Users}        label="Labeler Aktif"   value={labelers.length} sub="sedang mengerjakan" />
              </div>

              {/* Klaim gambar */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">Ambil Gambar ke Batch</p>
                    <p className="text-xs text-gray-500">
                      {unassigned === null ? "Memuat..." : unassigned === 0
                        ? "Semua gambar sudah diambil oleh labeler lain."
                        : <><span className="font-semibold text-gray-700 tabular-nums">{unassigned}</span> gambar belum diambil siapapun</>
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {BATCH_PRESETS.map(n => (
                      <button key={n} onClick={() => setClaimCount(n)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                          ${claimCount === n
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        +{n}
                      </button>
                    ))}
                    <div className="w-px h-5 bg-gray-200" />
                    <input
                      type="number" min={1} max={unassigned ?? 999}
                      className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900
                        bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 tabular-nums"
                      value={claimCount}
                      onChange={e => setClaimCount(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                    <button onClick={claimMore}
                      disabled={claiming || !claimCount || unassigned === 0}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold
                        hover:bg-gray-800 disabled:opacity-40 transition-colors">
                      {claiming
                        ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengambil...</>
                        : <><Package size={12} /> Ambil</>
                      }
                    </button>
                  </div>
                </div>
                {rows.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Batch aktif: <span className="font-semibold text-gray-900 tabular-nums">{rows.length}</span> gambar tersisa
                    </p>
                    <button onClick={() => setActiveNav("labeling")}
                      className="text-xs font-semibold text-gray-900 hover:underline">
                      Lanjut labeling →
                    </button>
                  </div>
                )}
              </div>

              {/* Progress global bar */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-900">Progress Global</p>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-5">
                  <div className="bg-gray-900 h-3 rounded-full"
                    style={{ width: `${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%` }} />
                </div>

                {/* Per-class progress */}
                <div className="space-y-3">
                  {Object.entries(CLASS_META).map(([cls, meta]) => {
                    const total   = stats.by_class[cls] ?? 0;
                    const done    = stats.verified_by_class[cls] ?? 0;
                    const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <div key={cls}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                            <span className="text-sm text-gray-700">{meta.label}</span>
                          </div>
                          <span className="text-xs text-gray-500 tabular-nums">{done}/{total} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${meta.dot}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Labeler aktif */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={15} className="text-gray-400" />
                    <p className="text-sm font-bold text-gray-900">Labeler Aktif</p>
                  </div>
                  {labelers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Tidak ada labeler aktif saat ini</p>
                  ) : (
                    <div className="space-y-3">
                      {labelers.map((l, i) => (
                        <div key={l.name} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-4 tabular-nums">{i + 1}</span>
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                            {l.name[0].toUpperCase()}
                          </div>
                          <span className="flex-1 text-sm text-gray-700 truncate">{l.name}</span>
                          <span className="text-xs font-semibold text-gray-500 tabular-nums">{l.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={15} className="text-gray-400" />
                    <p className="text-sm font-bold text-gray-900">Batch Kamu</p>
                  </div>
                  <div className="flex flex-col items-center justify-center h-28 gap-2">
                    <p className="text-4xl font-bold text-gray-900 tabular-nums">{batchDone}<span className="text-xl text-gray-400">/{batchTotal}</span></p>
                    <p className="text-sm text-gray-500">{batchPct}% selesai</p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                      <div className="bg-gray-900 h-2 rounded-full" style={{ width: `${batchPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ EXPORT ══ */}
          {activeNav === "export" && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard icon={CheckCircle2} label="Siap Diexport"  value={stats.verified} sub="gambar sudah verified" />
                <StatCard icon={Clock}        label="Belum Verified" value={stats.total - stats.verified} sub="belum bisa diexport" />
                <StatCard icon={Package}      label="Total Dataset"  value={stats.total} sub="semua gambar" />
              </div>

              {/* ZIP utama — semua kelas */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">Export ZIP — Gambar + Label</p>
                    <p className="text-xs text-gray-500">Semua {stats.verified} gambar verified dikemas bersama <code className="bg-gray-100 px-1 rounded">labels.csv</code> dalam folder terstruktur per kelas.</p>
                  </div>
                  <button onClick={() => exportZIP()} disabled={!!zipProgress || stats.verified === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold
                      hover:bg-gray-800 disabled:opacity-40 transition-colors shrink-0">
                    {zipProgress
                      ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                      : <><Package size={14} /> Download ZIP</>}
                  </button>
                </div>

                {/* Struktur folder */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-xs text-gray-600 space-y-0.5">
                  <p className="text-gray-400">Struktur ZIP:</p>
                  <p>ocr_dataset_YYYY-MM-DD<span className="text-gray-400">.zip</span></p>
                  <p className="pl-4">├── <span className="text-gray-900 font-semibold">labels.csv</span></p>
                  {Object.entries(CLASS_META).map(([cls, meta]) => (
                    <p key={cls} className="pl-4">
                      ├── <span className={cls === "total_belanja" ? "text-rose-600" : cls === "line_item" ? "text-emerald-600" : cls === "tanggal_waktu" ? "text-amber-600" : "text-blue-600"}>{cls}/</span>
                      <span className="text-gray-400 ml-2">({stats.verified_by_class[cls] ?? 0} gambar)</span>
                    </p>
                  ))}
                  <p className="pt-1 text-[10px] text-gray-400">labels.csv: filepath, label, class</p>
                </div>

                {/* Progress bar */}
                {zipProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{zipProgress.phase === "zipping" ? "Mengemas ZIP..." : `Mengunduh gambar ${zipProgress.current} / ${zipProgress.total}`}</span>
                      <span className="font-semibold tabular-nums">{Math.round((zipProgress.current / zipProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-gray-900 h-2 rounded-full"
                        style={{ width: `${Math.round((zipProgress.current / zipProgress.total) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Per kelas */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <p className="text-sm font-bold text-gray-900 mb-4">Export per Kelas</p>
                <div className="space-y-2">
                  {Object.entries(CLASS_META).map(([cls, meta]) => {
                    const done = stats.verified_by_class[cls] ?? 0;
                    return (
                      <div key={cls} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                          <span className="text-sm text-gray-700">{meta.label}</span>
                          <span className="text-xs text-gray-400 tabular-nums">{done} gambar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => exportZIP(cls)} disabled={!!zipProgress || done === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium
                              hover:bg-gray-800 disabled:opacity-40 transition-colors">
                            <Package size={11} /> ZIP
                          </button>
                          <button onClick={() => exportCSV(cls)} disabled={exporting || done === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium
                              text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                            <FileDown size={11} /> CSV
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <p className="text-sm font-bold text-gray-900 mb-4">Preview labels.csv (10 baris pertama)</p>
                {exportRows === null ? (
                  <p className="text-sm text-gray-400">Memuat...</p>
                ) : exportRows.length === 0 ? (
                  <p className="text-sm text-gray-400">Belum ada data verified.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["filepath", "label", "class", "updated_by"].map(h => (
                            <th key={h} className="text-left py-2 pr-4 text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exportRows.map(r => {
                          const basename = r.filename.split("/").pop() ?? r.filename;
                          return (
                            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2 pr-4 text-gray-500 font-mono truncate max-w-40">{r.class}/{basename}</td>
                              <td className="py-2 pr-4 text-gray-900 font-mono">{r.label || <span className="text-gray-300">—</span>}</td>
                              <td className="py-2 pr-4">
                                {CLASS_META[r.class] && (
                                  <span className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${CLASS_META[r.class].dot}`} />
                                    <span className="text-gray-600">{CLASS_META[r.class].label}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-gray-500">{r.updated_by ?? "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ EDIT VERIFIED ══ */}
          {activeNav === "edit" && (
            <>
              {/* ── Modal ── */}
              {editingRow && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                  onClick={() => !editSaving && setEditingRow(null)}>
                  <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}>

                    {/* Gambar */}
                    <div className="bg-zinc-950 flex items-center justify-center" style={{ minHeight: 180 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${BUCKET_URL}/${editingRow.filename}`} alt={editingRow.filename}
                        className="object-contain max-w-full"
                        style={{ maxHeight: 220, imageRendering: "pixelated" }} />
                    </div>

                    {/* Konten */}
                    <div className="p-5 space-y-4">
                      {/* Header info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-gray-500 truncate">{editingRow.filename}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            {CLASS_META[editingRow.class] && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                <span className={`w-2 h-2 rounded-full ${CLASS_META[editingRow.class].dot}`} />
                                {CLASS_META[editingRow.class].label}
                              </span>
                            )}
                            {editingRow.updated_by && (
                              <span className="text-xs text-gray-400">oleh {editingRow.updated_by}</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => setEditingRow(null)} disabled={editSaving}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 shrink-0 transition-colors">
                          <X size={13} />
                        </button>
                      </div>

                      {/* Label edit */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Label</label>
                        <textarea
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 font-mono text-sm text-gray-900
                            bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none min-h-20"
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) saveEditVerified(); }}
                          autoFocus
                        />
                        <p className="text-[10px] text-gray-400">Ctrl+Enter untuk simpan</p>
                      </div>

                      {/* Aksi */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button onClick={saveEditVerified} disabled={editSaving}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold
                            hover:bg-gray-800 disabled:opacity-40 transition-colors col-span-1">
                          {editSaving
                            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><Save size={13} /> Simpan</>}
                        </button>
                        <button
                          onClick={async () => { await unverify(editingRow); setEditingRow(null); }}
                          disabled={editSaving}
                          className="flex items-center justify-center gap-1.5 py-2.5 border border-amber-200 text-amber-600 rounded-xl text-sm font-medium
                            hover:bg-amber-50 disabled:opacity-40 transition-colors">
                          <RefreshCw size={13} /> Revert
                        </button>
                        <button
                          onClick={async () => { await deleteVerified(editingRow); setEditingRow(null); }}
                          disabled={editSaving}
                          className="flex items-center justify-center gap-1.5 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium
                            hover:bg-red-50 disabled:opacity-40 transition-colors">
                          <Trash2 size={13} /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Toolbar ── */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Total: <span className="font-semibold text-gray-900">{verifiedRows?.length ?? "—"}</span> data verified
                  <span className="ml-2 text-gray-400 text-xs">· klik baris untuk edit</span>
                </p>
                <button onClick={loadVerified} disabled={verifiedLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  <RefreshCw size={13} className={verifiedLoading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {/* ── Tabel ── */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {verifiedLoading ? (
                  <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
                    <span className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                    <span className="text-sm">Memuat data verified...</span>
                  </div>
                ) : !verifiedRows || verifiedRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
                    <CheckCircle2 size={32} className="text-gray-200" />
                    <p className="text-sm">Belum ada data verified.</p>
                  </div>
                ) : (
                  (() => {
                    const totalPages = Math.ceil(verifiedRows.length / VERIFIED_PAGE_SIZE);
                    const pageRows   = verifiedRows.slice((verifiedPage - 1) * VERIFIED_PAGE_SIZE, verifiedPage * VERIFIED_PAGE_SIZE);
                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="px-5 py-3 w-24" />
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Filename</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Label</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Kelas</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Oleh</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageRows.map(row => (
                                <tr key={row.id}
                                  onClick={() => { setEditingRow(row); setEditLabel(row.label ?? ""); }}
                                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                                  <td className="px-5 py-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={`${BUCKET_URL}/${row.filename}`} alt={row.filename}
                                      className="rounded-lg border border-gray-200 bg-zinc-900 object-contain"
                                      style={{ width: 80, height: 40, imageRendering: "pixelated" }} />
                                  </td>
                                  <td className="px-5 py-3 font-mono text-xs text-gray-500 truncate max-w-40">{row.filename}</td>
                                  <td className="px-5 py-3 font-mono text-gray-900 max-w-52">
                                    <span className="truncate block">{row.label || <span className="text-gray-300">—</span>}</span>
                                  </td>
                                  <td className="px-5 py-3">
                                    {CLASS_META[row.class] && (
                                      <span className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${CLASS_META[row.class].dot}`} />
                                        {CLASS_META[row.class].label}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3 text-xs text-gray-500">{row.updated_by ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                            <p className="text-xs text-gray-500 tabular-nums">
                              {(verifiedPage - 1) * VERIFIED_PAGE_SIZE + 1}–{Math.min(verifiedPage * VERIFIED_PAGE_SIZE, verifiedRows.length)} dari {verifiedRows.length}
                            </p>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setVerifiedPage(1)} disabled={verifiedPage === 1}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 transition-colors text-xs font-bold">
                                «
                              </button>
                              <button onClick={() => setVerifiedPage(p => p - 1)} disabled={verifiedPage === 1}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 transition-colors">
                                <ChevronLeft size={13} />
                              </button>
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - verifiedPage) <= 1)
                                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                                  acc.push(p);
                                  return acc;
                                }, [])
                                .map((p, i) =>
                                  p === "…"
                                    ? <span key={`e${i}`} className="w-7 text-center text-xs text-gray-400">…</span>
                                    : <button key={p} onClick={() => setVerifiedPage(p as number)}
                                        className={`w-7 h-7 rounded-lg border text-xs font-semibold transition-colors
                                          ${verifiedPage === p ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-white"}`}>
                                        {p}
                                      </button>
                                )
                              }
                              <button onClick={() => setVerifiedPage(p => p + 1)} disabled={verifiedPage === totalPages}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 transition-colors">
                                <ChevronRight size={13} />
                              </button>
                              <button onClick={() => setVerifiedPage(totalPages)} disabled={verifiedPage === totalPages}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 transition-colors text-xs font-bold">
                                »
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            </>
          )}

          {/* ══ LABELING ══ */}
          {activeNav === "labeling" && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard icon={Package}      label="Batch Kamu"      value={`${batchDone}/${batchTotal}`} sub={`${batchPct}% selesai`} />
                <StatCard icon={CheckCircle2} label="Total Verified"  value={stats.verified} sub="semua labeler" />
                <StatCard icon={Clock}        label="Sisa Batch"      value={rows.length} sub="gambar tersisa" />
                <StatCard icon={Search}       label="Labeler Aktif"   value={name} sub="sesi ini" />
              </div>

              {/* Progress global */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900">Progress Global</p>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-gray-900 h-2.5 rounded-full"
                    style={{ width: `${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%` }} />
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  {Object.entries(CLASS_META).map(([cls, meta]) => (
                    <div key={cls} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <span className="text-xs text-gray-600">{meta.label}: <strong>{stats.by_class[cls] ?? 0}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labeling area */}
              {rows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-64 gap-3">
                  <CheckCircle2 size={40} className="text-green-500" />
                  <p className="font-bold text-gray-900 text-lg">Batch kamu selesai!</p>
                  <p className="text-sm text-gray-500">Terima kasih sudah membantu labeling.</p>
                  <button onClick={() => setActiveNav("dashboard")}
                    className="mt-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                    Ambil Batch Baru
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-4">
                  {/* Gambar */}
                  <div className="col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                    {/* Toolbar */}
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <span className="text-xs text-gray-500 font-medium">Image Viewer</span>
                      <div className="flex items-center gap-1">
                        {/* Zoom */}
                        <button onClick={() => setZoomLevel(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
                          disabled={zoomLevel <= 0.5}
                          className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                          <ZoomOut size={13} />
                        </button>
                        <span className="text-xs font-mono text-gray-700 w-12 text-center tabular-nums">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(z => Math.min(4, parseFloat((z + 0.25).toFixed(2))))}
                          disabled={zoomLevel >= 4}
                          className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                          <ZoomIn size={13} />
                        </button>
                        <button onClick={() => setZoomLevel(1)} disabled={zoomLevel === 1}
                          className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                          <RotateCcw size={12} />
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        {/* Rotate */}
                        <button onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                          className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Putar kiri 90°">
                          <RotateCcw size={13} />
                        </button>
                        <span className="text-xs font-mono text-gray-500 w-8 text-center tabular-nums">{rotation}°</span>
                        <button onClick={() => setRotation(r => (r + 90) % 360)}
                          className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Putar kanan 90°">
                          <RotateCw size={13} />
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        {/* Hapus */}
                        <button onClick={deleteEntry} disabled={deleting || !current}
                          className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition-colors"
                          title="Hapus entry ini">
                          {deleting ? <span className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                    {/* Gambar */}
                    <div className="bg-zinc-950 flex items-center justify-center overflow-auto"
                      style={{ minHeight: 200, maxHeight: 400 }}
                      onWheel={e => { e.preventDefault(); setZoomLevel(z => Math.min(4, Math.max(0.5, parseFloat((z + (e.deltaY < 0 ? 0.25 : -0.25)).toFixed(2))))); }}>
                      {current && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${BUCKET_URL}/${current.filename}`} alt={current.filename}
                          className="object-contain"
                          style={{
                            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                            transformOrigin: "center",
                            imageRendering: "pixelated",
                            margin: zoomLevel > 1 ? `${(zoomLevel - 1) * 80}px ${(zoomLevel - 1) * 120}px` : 0,
                          }} />
                      )}
                    </div>
                    {/* Nav bawah */}
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2">
                        <button onClick={goPrev} disabled={index === 0}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-sm text-gray-600 font-medium w-24 text-center tabular-nums">{index + 1} / {rows.length}</span>
                        <button onClick={goNext} disabled={index === rows.length - 1}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {current && CLASS_META[current.class] && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg font-medium">
                            <span className={`w-1.5 h-1.5 rounded-full ${CLASS_META[current.class].dot}`} />
                            {CLASS_META[current.class].label}
                          </span>
                        )}
                        {current?.verified && (
                          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg font-medium">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-mono hidden xl:block">{current?.filename}</span>
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Label Teks</p>
                      <p className="text-xs text-gray-500 mt-0.5">Ketik teks yang terlihat di gambar</p>
                    </div>
                    <textarea ref={inputRef}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 font-mono text-sm
                        text-gray-900 bg-gray-50 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                        resize-none min-h-32"
                      value={inputLabel}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(true); }
                        if (e.key === "Escape") goNext();
                        if (e.key === "ArrowLeft"  && e.ctrlKey) goPrev();
                        if (e.key === "ArrowRight" && e.ctrlKey) goNext();
                      }}
                      placeholder="Contoh: GEO MILD 3 PCS 24.500" />
                    <div className="space-y-2">
                      <button onClick={() => save(true)} disabled={saving}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm">
                        {saving
                          ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                          : <><CheckCircle2 size={15} /> Verify &amp; Next</>}
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => save(false)} disabled={saving}
                          className="py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
                          <Save size={13} /> Simpan Draf
                        </button>
                        <button onClick={goNext}
                          className="py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                          <SkipForward size={13} /> Lewati
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Info size={12} className="text-gray-400" />
                        <p className="text-xs font-semibold text-gray-600">Tips verifikasi</p>
                      </div>
                      <ul className="text-xs text-gray-500 space-y-1">
                        {["Ketik ulang teks persis seperti di gambar", "Pisahkan dengan spasi, bukan koma", "Kosongkan jika tidak terbaca, lalu Lewati"].map(t => (
                          <li key={t} className="flex items-start gap-1.5">
                            <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 shrink-0" />{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ROOT — orchestrate phases
════════════════════════════════════════════════════════ */
export default function App() {
  const [phase, setPhase]           = useState<Phase>("auth");
  const [name, setName]             = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setName(session.user.email?.split("@")[0] ?? "user");
        setPhase("labeling");
      }
      setSessionChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setName(""); setPhase("auth"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = (email: string) => {
    setName(email.split("@")[0]);
    setPhase("labeling");
  };
  const handleSignOut = async () => { await supabase.auth.signOut(); };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "auth") return <AuthScreen onAuth={handleAuth} />;
  return <LabelingScreen name={name} onSignOut={handleSignOut} />;
}
