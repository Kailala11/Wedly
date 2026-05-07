import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fmt, fmtDate, getDaysUntil, CHECKLIST_TEMPLATE } from '../utils/helpers';
import { Card, Badge, Btn, Input, Select, Spinner, Empty, Modal, SectionHeader } from '../components/UI';

export default function EventsPage({ setPage, setSelectedEventId }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', venue: '', budget: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: ev }, { data: vd }] = await Promise.all([
      supabase.from('events').select('*').eq('user_id', user.id).order('date'),
      supabase.from('vendors').select('*').eq('user_id', user.id),
    ]);
    setEvents(ev || []);
    setVendors(vd || []);
    setLoading(false);
  }

  async function saveEvent() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: ev } = await supabase.from('events').insert({
      user_id: user.id,
      name: form.name.trim(),
      date: form.date || null,
      venue: form.venue.trim(),
      budget: parseInt(form.budget) || 0,
      status: 'planning',
    }).select().single();

    if (ev) {
      // Insert default checklist
      const items = CHECKLIST_TEMPLATE.flatMap((g, gi) =>
        g.items.map((text, ii) => ({
          event_id: ev.id, user_id: user.id,
          group_name: g.group, text,
          done: false, sort_order: gi * 100 + ii,
        }))
      );
      await supabase.from('checklist_items').insert(items);
    }

    setForm({ name: '', date: '', venue: '', budget: '' });
    setShowModal(false);
    setSaving(false);
    fetchAll();
  }

  async function deleteEvent(id, e) {
    e.stopPropagation();
    if (!window.confirm('Hapus event ini? Semua data terkait akan ikut terhapus.')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchAll();
  }

  const openEvent = (id) => {
    setSelectedEventId(id);
    setPage('event-detail');
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <SectionHeader
        title={<div><div className="text-xl font-bold text-gray-900">Events</div><div className="text-sm text-gray-500 font-normal">Kelola semua event wedding</div></div>}
        action={<Btn onClick={() => setShowModal(true)}>+ Tambah Event</Btn>}
      />

      {events.length === 0 ? (
        <Empty text="Belum ada event. Buat event pertama kamu!" icon="🎊" />
      ) : (
        events.map(ev => {
          const evVendors = vendors.filter(v => v.event_id === ev.id);
          const totalCost = evVendors.reduce((s, v) => s + (v.contract_amount || 0), 0);
          const profit = ev.budget - totalCost;
          const urgent = evVendors.filter(v => {
            if (!v.due_date || v.status === 'lunas') return false;
            const d = getDaysUntil(v.due_date);
            return d !== null && d <= 7;
          }).length;

          return (
            <Card key={ev.id} onClick={() => openEvent(ev.id)} className="p-4 mb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-gray-900">{ev.name}</span>
                    {urgent > 0 && (
                      <span className="text-xs bg-[#FCEBEB] text-[#E24B4A] font-bold px-2 py-0.5 rounded-full">
                        {urgent} jatuh tempo
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{fmtDate(ev.date)} · {ev.venue || '-'}</div>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <Badge status={ev.status} />
                  <button
                    onClick={(e) => deleteEvent(ev.id, e)}
                    className="text-xs text-[#E24B4A] border border-[#E5E0D8] px-2 py-1 rounded-lg hover:bg-[#FCEBEB]"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-[#E5E0D8] flex-wrap">
                <div className="text-xs text-gray-500">Budget: <b className="text-gray-800">{fmt(ev.budget)}</b></div>
                <div className="text-xs text-gray-500">Vendor: <b className="text-gray-800">{evVendors.length}</b></div>
                <div className="text-xs text-gray-500">
                  Est. Profit: <b className={profit >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}>{fmt(profit)}</b>
                </div>
              </div>
            </Card>
          );
        })
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Tambah Event Baru">
        <div className="flex flex-col gap-3">
          <Input label="Nama Klien / Event" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="cth. Budi & Sari" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tanggal" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <Input label="Venue" value={form.venue} onChange={v => setForm(f => ({ ...f, venue: v }))} placeholder="cth. Grand Ballroom" />
          </div>
          <Input label="Budget Total Klien (Rp)" type="number" value={form.budget} onChange={v => setForm(f => ({ ...f, budget: v }))} placeholder="cth. 150000000" />
          <div className="flex gap-2 mt-2">
            <Btn onClick={saveEvent} disabled={saving} className="flex-1">
              {saving ? 'Menyimpan...' : 'Simpan Event'}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
