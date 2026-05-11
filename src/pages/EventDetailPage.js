import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fmt, fmtDate, getDaysUntil, getDueLabel, VENDOR_CATEGORIES } from '../utils/helpers';
import {
  Card, Btn, Input, Select, Spinner, Empty, Modal,
  SectionHeader, MetricCard, ProgressBar, StatusPill, Alert
} from '../components/UI';
import MeetingNotes from '../components/MeetingNotes';
import Reminders from '../components/Reminders';

const TABS = ['Vendor', 'Keuangan', 'Timeline', 'Checklist', 'Rapat', 'Reminder', 'Dokumen', 'AI Advisor'];

export default function EventDetailPage({ eventId, setPage }) {
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  // Vendor modal
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vForm, setVForm] = useState({ name:'', category:'Katering', contract_amount:'', paid_amount:'', contact:'', due_date:'', status:'belum' });
  const [vSaving, setVSaving] = useState(false);

  // Timeline modal
  const [showTlModal, setShowTlModal] = useState(false);
  const [tlForm, setTlForm] = useState({ time:'', activity:'', pic:'' });

  // AI
  const [aiForm, setAiForm] = useState({ kota:'', tamu:'', tema:'Modern', budget:'' });
  const [aiResult, setAiResult] = useState('');
  const [aiAlloc, setAiAlloc] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const fileRef = useRef();

  // CHECKLIST CUSTOM
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [clForm, setClForm] = useState({ group_name: 'H-30', text: '' });

  useEffect(() => { if (eventId) fetchAll(); }, [eventId]); // eslint-disable-line

  async function fetchAll() {
    setLoading(true);
    const [{ data: ev }, { data: vd }, { data: tl }, { data: cl }, { data: doc }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('vendors').select('*').eq('event_id', eventId).order('created_at'),
      supabase.from('timeline').select('*').eq('event_id', eventId).order('time'),
      supabase.from('checklist_items').select('*').eq('event_id', eventId).order('sort_order'),
      supabase.from('documents').select('*').eq('event_id', eventId).order('created_at'),
    ]);
    setEvent(ev);
    setVendors(vd || []);
    setTimeline(tl || []);
    setChecklist(cl || []);
    setDocuments(doc || []);
    setLoading(false);
  }

  async function updateEventStatus(status) {
    await supabase.from('events').update({ status }).eq('id', eventId);
    setEvent(e => ({ ...e, status }));
  }

  // VENDOR
  async function saveVendor() {
    if (!vForm.name.trim()) return;
    setVSaving(true);
    await supabase.from('vendors').insert({
      event_id: eventId, user_id: user.id,
      name: vForm.name.trim(), category: vForm.category,
      contract_amount: parseInt(vForm.contract_amount) || 0,
      paid_amount: parseInt(vForm.paid_amount) || 0,
      contact: vForm.contact, due_date: vForm.due_date || null,
      status: vForm.status,
    });
    setVForm({ name:'', category:'Katering', contract_amount:'', paid_amount:'', contact:'', due_date:'', status:'belum' });
    setShowVendorModal(false);
    setVSaving(false);
    fetchAll();
  }

  async function updateVendorStatus(id, status) {
    await supabase.from('vendors').update({ status }).eq('id', id);
    setVendors(vs => vs.map(v => v.id === id ? { ...v, status } : v));
  }

  async function deleteVendor(id) {
    if (!window.confirm('Hapus vendor ini?')) return;
    await supabase.from('vendors').delete().eq('id', id);
    setVendors(vs => vs.filter(v => v.id !== id));
  }

  // TIMELINE
  async function saveTimeline() {
    if (!tlForm.time || !tlForm.activity.trim()) return;
    await supabase.from('timeline').insert({
      event_id: eventId, user_id: user.id,
      time: tlForm.time, activity: tlForm.activity.trim(), pic: tlForm.pic, done: false,
    });
    setTlForm({ time:'', activity:'', pic:'' });
    setShowTlModal(false);
    fetchAll();
  }

  async function toggleTlDone(id, done) {
    await supabase.from('timeline').update({ done: !done }).eq('id', id);
    setTimeline(tl => tl.map(t => t.id === id ? { ...t, done: !done } : t));
  }

  async function deleteTl(id) {
    await supabase.from('timeline').delete().eq('id', id);
    setTimeline(tl => tl.filter(t => t.id !== id));
  }

  // CHECKLIST
  async function toggleChecklist(id, done) {
    await supabase.from('checklist_items').update({ done: !done }).eq('id', id);
    setChecklist(cl => cl.map(c => c.id === id ? { ...c, done: !done } : c));
  }

  async function saveChecklistItem() {
    if (!clForm.text.trim()) return;
    const maxOrder = checklist.filter(c => c.group_name === clForm.group_name).length;
    await supabase.from('checklist_items').insert({
      event_id: eventId, user_id: user.id,
      group_name: clForm.group_name,
      text: clForm.text.trim(),
      done: false,
      sort_order: maxOrder * 100 + 99,
    });
    setClForm(f => ({ ...f, text: '' }));
    setShowAddChecklist(false);
    fetchAll();
  }

  async function deleteChecklistItem(id) {
    await supabase.from('checklist_items').delete().eq('id', id);
    setChecklist(cl => cl.filter(c => c.id !== id));
  }

  // DOCUMENTS
  async function uploadDoc(e) {
    const file = e.target.files[0]; if (!file) return;
    const path = `${user.id}/${eventId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (!error) {
      const size = file.size < 1048576 ? (file.size / 1024).toFixed(0) + ' KB' : (file.size / 1048576).toFixed(1) + ' MB';
      await supabase.from('documents').insert({
        event_id: eventId, user_id: user.id,
        name: file.name, size, storage_path: path,
      });
      fetchAll();
    }
    e.target.value = '';
  }

  async function downloadDoc(doc) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function deleteDoc(id, path) {
    await supabase.storage.from('documents').remove([path]);
    await supabase.from('documents').delete().eq('id', id);
    setDocuments(ds => ds.filter(d => d.id !== id));
  }

  async function runAI() {
    if (!aiForm.kota || !aiForm.tamu) return;
    setAiLoading(true);
    try {
      const budget = aiForm.budget || event?.budget || 0;
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Kamu konsultan WO berpengalaman di Indonesia.
Klien: ${event?.name}
Kota: ${aiForm.kota}, Tamu: ${aiForm.tamu}, Tema: ${aiForm.tema}, Budget: Rp ${Number(budget).toLocaleString('id-ID')}

Berikan:
1. Analisis apakah budget realistis
2. Rekomendasi alokasi budget per kategori
3. Tips negosiasi vendor

JSON alokasi di akhir dalam blok \`\`\`json ... \`\`\`:
[{"cat":"Katering","pct":35,"nominal":52500000},...]
Kategori: Katering, Dekorasi, Fotografer, Videografer, Gedung/Venue, MC & Musik, Makeup & Busana, Undangan & Souvenir, Transportasi, Cadangan
Total pct=100. Bahasa Indonesia, maks 200 kata.`
          }]
        })
      });
      const data = await res.json();
      const raw = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
      const jm = raw.match(/```json([\s\S]*?)```/);
      if (jm) { try { setAiAlloc(JSON.parse(jm[1].trim())); } catch (e) {} }
      setAiResult(raw.replace(/```json[\s\S]*?```/g, '').trim());
    } catch (err) {
      setAiResult('Gagal menghubungi AI. Coba lagi.');
    }
    setAiLoading(false);
  }

  // CALCULATIONS
  const totalCost = vendors.reduce((s, v) => s + (v.contract_amount || 0), 0);
  const totalPaid = vendors.reduce((s, v) => s + (v.paid_amount || 0), 0);
  const totalUnpaid = totalCost - totalPaid;
  const profit = (event?.budget || 0) - totalCost;
  const budgetPct = event?.budget > 0 ? Math.min(100, Math.round(totalCost / event.budget * 100)) : 0;
  const overdueVendors = vendors.filter(v => v.due_date && v.status !== 'lunas' && getDaysUntil(v.due_date) < 0);
  const soonVendors = vendors.filter(v => v.due_date && v.status !== 'lunas' && getDaysUntil(v.due_date) >= 0 && getDaysUntil(v.due_date) <= 7);
  const clTotal = checklist.length;
  const clDone = checklist.filter(c => c.done).length;
  const clPct = clTotal > 0 ? Math.round(clDone / clTotal * 100) : 0;
  const clGroups = [...new Set(checklist.map(c => c.group_name))];

  if (loading) return <Spinner />;
  if (!event) return <div className="p-6 text-gray-500">Event tidak ditemukan.</div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Back + Header */}
      <button onClick={() => setPage('events')} className="text-sm text-[#D4537E] font-semibold mb-4 flex items-center gap-1">
        ← Kembali ke Events
      </button>

      <Card className="p-4 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{event.name}</h1>
            <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
              <span>{fmtDate(event.date)}</span>
              <span>{event.venue || '-'}</span>
              <span>Budget: {fmt(event.budget)}</span>
            </div>
          </div>
<<<<<<< HEAD
      <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
=======
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
>>>>>>> 95f045fd16fce2414d116965c469852fec491ea4
          <Btn variant="teal" size="sm" onClick={() => {/* export excel */}}>↓ Excel</Btn>
          <Btn variant="amber" size="sm" onClick={() => {/* export pdf */}}>↓ PDF</Btn>
          <select
            value={event.status}
            onChange={e => updateEventStatus(e.target.value)}
            className="text-xs border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 bg-white text-gray-600 appearance-none cursor-pointer"
          >
            <option value="planning">Planning</option>
            <option value="ongoing">Ongoing</option>
            <option value="done">Done</option>
          </select>
        </div>
        </div>
      </Card>

      {/* Alerts */}
      {overdueVendors.length > 0 && (
        <Alert type="red"><span>⚠️</span><div><b>{overdueVendors.length} vendor terlambat:</b> {overdueVendors.map(v => v.name).join(', ')}</div></Alert>
      )}
      {soonVendors.length > 0 && (
        <Alert type="amber"><span>⏰</span><div><b>{soonVendors.length} jatuh tempo ≤7 hari:</b> {soonVendors.map(v => v.name).join(', ')}</div></Alert>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-[#E5E0D8] mb-4 -mx-4 px-4">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${tab === i ? 'border-[#D4537E] text-[#D4537E] font-semibold' : 'border-transparent text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TAB 0: VENDOR */}
      {tab === 0 && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard label="Total Vendor" value={fmt(totalCost)} sub={`${budgetPct}% dari budget`} />
            <MetricCard label="Belum Dibayar" value={fmt(totalUnpaid)} color="text-[#BA7517]" />
          </div>
          <SectionHeader title={`Vendor (${vendors.length})`} action={<Btn size="sm" onClick={() => setShowVendorModal(true)}>+ Tambah</Btn>} />
          {vendors.length === 0 ? <Empty text="Belum ada vendor." icon="🤝" /> : vendors.map(v => {
            const sisa = (v.contract_amount || 0) - (v.paid_amount || 0);
            const dueLabel = getDueLabel(v.due_date, v.status);
            return (
              <Card key={v.id} className={`p-3 mb-2 ${getDaysUntil(v.due_date) < 0 && v.status !== 'lunas' ? 'border-red-300' : ''}`}>
                <div className="flex items-start justify-between">
                  <div><div className="text-sm font-semibold text-gray-900">{v.name}</div><div className="text-xs text-gray-400 mt-0.5">{v.category}{v.contact ? ` · ${v.contact}` : ''}</div></div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={v.status} onChange={s => updateVendorStatus(v.id, s)} />
                    <button onClick={() => deleteVendor(v.id)} className="text-gray-300 hover:text-[#E24B4A] text-lg">×</button>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2.5 pt-2.5 border-t border-[#E5E0D8]">
                  <div>
                    <div className="text-sm font-semibold">{fmt(v.contract_amount)}</div>
                    <div className="text-xs text-gray-400">Dibayar: {fmt(v.paid_amount)} · Sisa: {fmt(sisa)}</div>
                  </div>
                  {dueLabel && (
                    <div className={`text-xs font-semibold ${dueLabel.color}`}>{dueLabel.text}</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 1: KEUANGAN */}
      {tab === 1 && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricCard label="Budget Klien" value={fmt(event.budget)} />
            <MetricCard label="Total Vendor" value={fmt(totalCost)} />
            <MetricCard label="Est. Profit" value={fmt(profit)} color={profit >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'} />
          </div>
          <Card className="p-4 mb-4">
            <div className="flex justify-between mb-2"><span className="text-sm font-semibold">Penggunaan Budget</span><span className="text-sm text-gray-500">{budgetPct}%</span></div>
            <ProgressBar pct={budgetPct} height={8} />
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Terpakai: {fmt(totalCost)}</span><span>Sisa: {fmt(event.budget - totalCost)}</span>
            </div>
          </Card>
          <div className="text-sm font-bold text-gray-900 mb-3">Tagihan Belum Lunas</div>
          {vendors.filter(v => v.status !== 'lunas').length === 0
            ? <div className="text-sm text-gray-400 py-4 text-center">Semua vendor sudah lunas. ✅</div>
            : vendors.filter(v => v.status !== 'lunas').map(v => {
              const sisa = (v.contract_amount || 0) - (v.paid_amount || 0);
              const days = getDaysUntil(v.due_date);
              const dc = days !== null ? (days < 0 ? 'text-[#E24B4A]' : days <= 7 ? 'text-[#BA7517]' : 'text-gray-400') : 'text-gray-400';
              return (
                <div key={v.id} className="flex justify-between items-center py-3 border-b border-[#E5E0D8]">
                  <div><div className="text-sm font-semibold">{v.name}</div><div className={`text-xs ${dc}`}>{v.category}{v.due_date ? ` · ${fmtDate(v.due_date)}` : ''}</div></div>
                  <span className="text-sm font-bold text-[#BA7517]">{fmt(sisa)}</span>
                </div>
              );
            })
          }
        </div>
      )}

      {/* TAB 2: TIMELINE */}
      {tab === 2 && (
        <div>
          <SectionHeader title="Rundown Hari H" action={<Btn size="sm" onClick={() => setShowTlModal(true)}>+ Tambah</Btn>} />
          {timeline.length === 0 ? <Empty text="Belum ada rundown." icon="🗓" /> : (
            <div>
              {timeline.map((item, i) => (
                <div key={item.id} className={`flex gap-3 mb-3 ${item.done ? 'opacity-55' : ''}`}>
                  <div className="flex flex-col items-center min-w-[48px]">
                    <span className="text-xs font-semibold text-gray-500">{item.time}</span>
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${item.done ? 'bg-[#1D9E75]' : 'bg-[#D4537E]'}`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-[#E5E0D8] mt-1 min-h-[20px]" />}
                  </div>
                  <div className="flex-1">
                    <div className="bg-[#F4F0EC] rounded-xl p-3">
                      <div className={`text-sm font-semibold ${item.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.activity}</div>
                      {item.pic && <div className="text-xs text-gray-400 mt-1">{item.pic}</div>}
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <button onClick={() => toggleTlDone(item.id, item.done)} className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${item.done ? 'bg-[#E1F5EE] text-[#085041] border-[#6FCFAD]' : 'bg-[#F4F0EC] text-gray-500 border-[#E5E0D8]'}`}>
                        {item.done ? '✓ Done' : 'Tandai done'}
                      </button>
                      <button onClick={() => deleteTl(item.id)} className="text-xs text-[#E24B4A] px-2 py-1 rounded-lg border border-[#E5E0D8] hover:bg-[#FCEBEB]">×</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHECKLIST */}
      {tab === 3 && (
        <div>
          <Card className="p-4 mb-4">
            <div className="flex justify-between mb-2"><span className="text-sm font-semibold">Progress Persiapan</span><span className="text-sm text-gray-500">{clDone}/{clTotal} ({clPct}%)</span></div>
            <ProgressBar pct={clPct} color={clPct === 100 ? '#1D9E75' : '#D4537E'} height={8} />
          </Card>

          <SectionHeader
            title="Checklist"
            action={<Btn size="sm" onClick={() => setShowAddChecklist(!showAddChecklist)}>{showAddChecklist ? '× Tutup' : '+ Tambah Item'}</Btn>}
          />

          {showAddChecklist && (
            <Card className="p-3 mb-4 bg-[#F4F0EC]">
              <div className="flex flex-col gap-2">
                <Select
                  label="Grup"
                  value={clForm.group_name}
                  onChange={v => setClForm(f => ({ ...f, group_name: v }))}
                  options={['H-30', 'H-14', 'H-7', 'H-1', 'Lainnya']}
                />
                <Input
                  label="Item checklist"
                  value={clForm.text}
                  onChange={v => setClForm(f => ({ ...f, text: v }))}
                  placeholder="cth. Konfirmasi MC"
                />
                <div className="flex gap-2">
                  <Btn onClick={saveChecklistItem} className="flex-1">Simpan</Btn>
                  <Btn variant="ghost" onClick={() => setShowAddChecklist(false)}>Batal</Btn>
                </div>
              </div>
            </Card>
          )}

          {clGroups.map(group => {
            const items = checklist.filter(c => c.group_name === group);
            const groupDone = items.filter(c => c.done).length;
            return (
              <div key={group} className="mb-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{group} ({groupDone}/{items.length})</div>
                {items.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 px-3 py-2.5 bg-white border border-[#E5E0D8] rounded-xl mb-2 ${item.done ? 'opacity-55' : ''}`}>
                    <div
                      onClick={() => toggleChecklist(item.id, item.done)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors cursor-pointer ${item.done ? 'bg-[#1D9E75] border-[#1D9E75] text-white' : 'border-[#E5E0D8]'}`}
                    >
                      {item.done ? '✓' : ''}
                    </div>
                    <span
                      onClick={() => toggleChecklist(item.id, item.done)}
                      className={`text-sm flex-1 cursor-pointer ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}
                    >
                      {item.text}
                    </span>
                    <button
                      onClick={() => deleteChecklistItem(item.id)}
                      className="text-gray-300 hover:text-[#E24B4A] text-lg leading-none flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: RAPAT */}
      {tab === 4 && (
        <MeetingNotes eventId={eventId} />
      )}

      {/* TAB 5: REMINDER */}
      {tab === 5 && (
        <Reminders eventId={eventId} />
      )}

      {/* TAB 6: DOKUMEN */}
      {tab === 6 && (
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-[#E5E0D8] rounded-xl p-6 text-center cursor-pointer hover:border-[#D4537E] hover:bg-[#FBEAF0] transition-colors mb-4"
          >
            <div className="text-3xl mb-2">📄</div>
            <div className="text-sm font-semibold text-gray-700">Upload Dokumen PDF</div>
            <div className="text-xs text-gray-400 mt-1">Kontrak, invoice, MoU — klik untuk upload</div>
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={uploadDoc} />
          <SectionHeader title={`Dokumen (${documents.length})`} />
          {documents.length === 0 ? <Empty text="Belum ada dokumen." icon="📁" /> : documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between bg-[#F4F0EC] rounded-xl px-4 py-3 mb-2">
              <div className="min-w-0"><div className="text-sm font-semibold truncate">{doc.name}</div><div className="text-xs text-gray-400">{doc.size}</div></div>
              <div className="flex gap-2 ml-3 flex-shrink-0">
                <Btn variant="teal" size="xs" onClick={() => downloadDoc(doc)}>↓ Unduh</Btn>
                <Btn variant="danger" size="xs" onClick={() => deleteDoc(doc.id, doc.storage_path)}>×</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 7: AI ADVISOR */}
      {tab === 7 && (
        <div>
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E0D8] flex items-center gap-2">
              <span className="text-sm font-bold">AI Budget Advisor</span>
              <span className="text-xs bg-[#EEEDFE] text-[#534AB7] font-bold px-2 py-0.5 rounded-full">Claude</span>
            </div>
            <div className="p-4 border-b border-[#E5E0D8]">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input label="Kota" value={aiForm.kota} onChange={v => setAiForm(f => ({ ...f, kota: v }))} placeholder="cth. Jakarta" />
                <Input label="Jumlah Tamu" type="number" value={aiForm.tamu} onChange={v => setAiForm(f => ({ ...f, tamu: v }))} placeholder="cth. 200" />
                <Select label="Tema" value={aiForm.tema} onChange={v => setAiForm(f => ({ ...f, tema: v }))} options={['Rustic','Modern','Garden','Traditional','Mewah/Luxury','Minimalis','Beach','Outdoor']} />
                <Input label="Budget (Rp)" type="number" value={aiForm.budget || event?.budget || ''} onChange={v => setAiForm(f => ({ ...f, budget: v }))} />
              </div>
              <Btn onClick={runAI} disabled={aiLoading} className="w-full">
                {aiLoading ? '⏳ AI sedang menganalisis...' : 'Analisis Budget'}
              </Btn>
            </div>
            <div className="p-4">
              {!aiResult && !aiLoading && (
                <p className="text-sm text-gray-400">Isi form di atas dan klik "Analisis Budget".</p>
              )}
              {aiResult && (
                <div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{aiResult}</p>
                  {aiAlloc.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {aiAlloc.map(a => (
                        <div key={a.cat} className="bg-[#F4F0EC] rounded-xl p-3">
                          <div className="text-xs text-gray-400 mb-1">{a.cat}</div>
                          <div className="text-sm font-bold">{fmt(a.nominal)}</div>
                          <div className="text-xs text-gray-400">{a.pct}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* VENDOR MODAL */}
      <Modal open={showVendorModal} onClose={() => setShowVendorModal(false)} title="Tambah Vendor">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nama Vendor" value={vForm.name} onChange={v => setVForm(f => ({ ...f, name: v }))} placeholder="cth. Catering Bu Sari" />
            <Select label="Kategori" value={vForm.category} onChange={v => setVForm(f => ({ ...f, category: v }))} options={VENDOR_CATEGORIES} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nominal Kontrak (Rp)" type="number" value={vForm.contract_amount} onChange={v => setVForm(f => ({ ...f, contract_amount: v }))} placeholder="0" />
            <Input label="Sudah Dibayar (Rp)" type="number" value={vForm.paid_amount} onChange={v => setVForm(f => ({ ...f, paid_amount: v }))} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kontak" value={vForm.contact} onChange={v => setVForm(f => ({ ...f, contact: v }))} placeholder="No. HP / WA" />
            <Input label="Jatuh Tempo" type="date" value={vForm.due_date} onChange={v => setVForm(f => ({ ...f, due_date: v }))} />
          </div>
          <div className="flex gap-2 mt-1">
            <Btn onClick={saveVendor} disabled={vSaving} className="flex-1">{vSaving ? 'Menyimpan...' : 'Simpan'}</Btn>
            <Btn variant="ghost" onClick={() => setShowVendorModal(false)}>Batal</Btn>
          </div>
        </div>
      </Modal>

      {/* TIMELINE MODAL */}
      <Modal open={showTlModal} onClose={() => setShowTlModal(false)} title="Tambah Kegiatan">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Waktu" type="time" value={tlForm.time} onChange={v => setTlForm(f => ({ ...f, time: v }))} />
            <Input label="PIC / Vendor" value={tlForm.pic} onChange={v => setTlForm(f => ({ ...f, pic: v }))} placeholder="cth. MC, Fotografer" />
          </div>
          <Input label="Kegiatan" value={tlForm.activity} onChange={v => setTlForm(f => ({ ...f, activity: v }))} placeholder="cth. Akad nikah dimulai" />
          <div className="flex gap-2 mt-1">
            <Btn onClick={saveTimeline} className="flex-1">Simpan</Btn>
            <Btn variant="ghost" onClick={() => setShowTlModal(false)}>Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
