export const fmt = (n) =>
  'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

export const fmtDate = (d) => {
  if (!d) return '-';
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

export const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - now) / 86400000);
};

export const getDueLabel = (dateStr, status) => {
  if (!dateStr || status === 'lunas') return null;
  const days = getDaysUntil(dateStr);
  if (days === null) return null;
  if (days < 0) return { text: `${Math.abs(days)}h terlambat`, color: 'text-red-500' };
  if (days === 0) return { text: 'Hari ini!', color: 'text-red-500' };
  if (days <= 7) return { text: `${days}h lagi`, color: 'text-amber-600' };
  return { text: fmtDate(dateStr), color: 'text-gray-400' };
};

export const CHECKLIST_TEMPLATE = [
  { group: 'H-30', items: ['Konfirmasi semua vendor utama', 'Kirim rundown ke vendor', 'Cek DP semua vendor', 'Fitting busana pengantin', 'Finalisasi dekorasi'] },
  { group: 'H-14', items: ['Cek pelunasan vendor', 'Distribusi undangan selesai', 'Gladi resik (jika ada)', 'Konfirmasi jumlah tamu makan'] },
  { group: 'H-7',  items: ['Cek sound system & lighting', 'Brief tim di lapangan', 'Siapkan amplop honor MC & tim', 'Cek transportasi pengantin'] },
  { group: 'H-1',  items: ['Cek venue & dekorasi terpasang', 'Briefing akhir semua vendor', 'Siapkan perlengkapan darurat', 'Pastikan HP & kamera charged'] },
];

export const VENDOR_CATEGORIES = [
  'Katering', 'Dekorasi', 'Fotografer', 'Videografer',
  'MC', 'Musik', 'Gedung/Venue', 'Makeup & Busana',
  'Undangan', 'Transportasi', 'Lainnya'
];

export const CASHFLOW_CATEGORIES_IN = [
  'DP Klien', 'Pelunasan Klien', 'Uang Muka', 'Lainnya'
];

export const CASHFLOW_CATEGORIES_OUT = [
  'Bayar Vendor', 'Biaya Operasional', 'Transport', 'Cetak & Produksi',
  'Biaya Admin', 'Lainnya'
];
