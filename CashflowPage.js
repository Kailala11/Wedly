import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fmt, fmtDate, CASHFLOW_CATEGORIES_IN, CASHFLOW_CATEGORIES_OUT } from '../utils/helpers';
import { Card, Btn, Input, Select, Spinner, Empty, Modal, SectionHeader, MetricCard } from '../components/UI';

export default function CashflowPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all | in | out
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'in', event_id: '', category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: cf }, { data: ev }] = await Promise.all([
      supabase.from('cashflow').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('events').select('id, name').eq('user_id', user.id),
    ]);
    setRecords(cf || []);
    setEvents(ev || []);
    setLoading(false);
  }

  async function saveRecord() {
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    await supabase.from('cashflow').insert({
      user_id: user.id,
      type: form.type,
      event_id: form.event_id || null,
      category: form.category,
      description: form.description.trim(),
      amount: parseInt(form.amount) || 0,
      date: form.date,
    });
    setForm({ type: 'in', event_id: '', category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setShowModal(false);
    setSaving(false);
    fetchAll();
  }

  async function deleteRecord(id) {
    if (!window.confirm('Hapus catatan ini?')) return;
    await supabase.from('cashflow').delete().eq('id', id);
    fetchAll();
  }

  const totalIn = records.filter(r => r.type === 'in').reduce((s, r) => s + (r.amount || 0), 0);
  const totalOut = records.filter(r => r.type === 'out').reduce((s, r) => s + (r.amount || 0), 0);
  const balance = totalIn - totalOut;

  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter);
  const cats = form.type === 'in' ? CASHFLOW_CATEGORIES_IN : CASHFLOW_CATEGORIES_OUT;

  if (loading) return <Spinner />;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <SectionHeader
        title={<div><div className="text-xl font-bold text-gray-900">Keuangan</div><div className="text-sm text-gray-500 font-normal">Pencatatan pemasukan & pengeluaran</div></div>}
        action={<Btn onClick={() => setShowModal(true)}>+ Catat Transaksi</Btn>}
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <MetricCard label="Total Pemasukan" value={fmt(totalIn)} color="text-[#1D9E75]" />
        <MetricCard label="Total Pengeluaran" value={fmt(totalOut)} color="text-[#E24B4A]" />
        <MetricCard label="Saldo Kas" value={fmt(balance)} color={balance >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[['all', 'Semua'], ['in', 'Pemasukan'], ['out', 'Pengeluaran']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${filter === val ? 'bg-[#D4537E] text-white' : 'bg-white border border-[#E5E0D8] text-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <Empty text="Belum ada catatan transaksi." icon="💳" />
      ) : (
        filtered.map(r => {
          const ev = events.find(e => e.id === r.event_id);
          return (
            <Card key={r.id} className="px-4 py-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.type === 'in' ? 'bg-[#1D9E75]' : 'bg-[#E24B4A]'}`} />
                    <span className="text-sm font-semibold text-gray-900 truncate">{r.description}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 ml-4">
                    {r.category}{ev ? ` · ${ev.name}` : ''} · {fmtDate(r.date)}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className={`text-sm font-bold ${r.type === 'in' ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
                    {r.type === 'in' ? '+' : '-'}{fmt(r.amount)}
                  </span>
                  <button onClick={() => deleteRecord(r.id)} className="text-gray-300 hover:text-[#E24B4A] text-lg leading-none">×</button>
                </div>
              </div>
            </Card>
          );
        })
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Catat Transaksi">
        <div className="flex flex-col gap-3">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-[#E5E0D8]">
            <button
              onClick={() => setForm(f => ({ ...f, type: 'in', category: '' }))}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${form.type === 'in' ? 'bg-[#1D9E75] text-white' : 'bg-white text-gray-500'}`}
            >
              + Pemasukan
            </button>
            <button
              onClick={() => setForm(f => ({ ...f, type: 'out', category: '' }))}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${form.type === 'out' ? 'bg-[#E24B4A] text-white' : 'bg-white text-gray-500'}`}
            >
              - Pengeluaran
            </button>
          </div>

          <Input label="Deskripsi" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="cth. DP Katering Nusantara" />
          <Input label="Jumlah (Rp)" type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="0" />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Kategori"
              value={form.category}
              onChange={v => setForm(f => ({ ...f, category: v }))}
              options={['', ...cats]}
            />
            <Input label="Tanggal" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          </div>

          <Select
            label="Event terkait (opsional)"
            value={form.event_id}
            onChange={v => setForm(f => ({ ...f, event_id: v }))}
            options={[{ value: '', label: '— Tidak terkait event —' }, ...events.map(e => ({ value: e.id, label: e.name }))]}
          />

          <div className="flex gap-2 mt-1">
            <Btn onClick={saveRecord} disabled={saving} className="flex-1">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
