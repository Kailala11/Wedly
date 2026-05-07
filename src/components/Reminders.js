import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fmtDate, getDaysUntil } from '../utils/helpers';
import { Card, Btn, Input, Spinner, Empty, Modal, SectionHeader } from './UI';

export default function Reminders({ eventId }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', remind_date: '' });

  useEffect(() => { fetchReminders(); }, [eventId]); // eslint-disable-line

  async function fetchReminders() {
    setLoading(true);
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('event_id', eventId)
      .order('remind_date');
    setReminders(data || []);
    setLoading(false);
  }

  async function saveReminder() {
    if (!form.title.trim() || !form.remind_date) return;
    setSaving(true);
    await supabase.from('reminders').insert({
      event_id: eventId, user_id: user.id,
      title: form.title.trim(),
      description: form.description,
      remind_date: form.remind_date,
      done: false,
    });
    setForm({ title: '', description: '', remind_date: '' });
    setShowModal(false);
    setSaving(false);
    fetchReminders();
  }

  async function toggleReminder(id, done) {
    await supabase.from('reminders').update({ done: !done }).eq('id', id);
    setReminders(rs => rs.map(r => r.id === id ? { ...r, done: !done } : r));
  }

  async function deleteReminder(id) {
    await supabase.from('reminders').delete().eq('id', id);
    setReminders(rs => rs.filter(r => r.id !== id));
  }

  if (loading) return <Spinner />;

  const pending = reminders.filter(r => !r.done);
  const done = reminders.filter(r => r.done);

  return (
    <div>
      <SectionHeader
        title={`Reminder (${pending.length} aktif)`}
        action={<Btn size="sm" onClick={() => setShowModal(true)}>+ Tambah</Btn>}
      />

      {reminders.length === 0 ? (
        <Empty text="Belum ada reminder." icon="🔔" />
      ) : (
        <div>
          {pending.map(r => {
            const days = getDaysUntil(r.remind_date);
            const isOverdue = days !== null && days < 0;
            const isToday = days === 0;
            const isSoon = days !== null && days <= 3 && days > 0;
            return (
              <Card key={r.id} className={`p-3 mb-2 ${isOverdue ? 'border-red-300' : isSoon || isToday ? 'border-amber-300' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      onClick={() => toggleReminder(r.id, r.done)}
                      className="w-5 h-5 rounded-full border-2 border-[#E5E0D8] flex-shrink-0 mt-0.5 cursor-pointer hover:border-[#1D9E75]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{r.title}</div>
                      {r.description && <div className="text-xs text-gray-500 mt-0.5">{r.description}</div>}
                      <div className={`text-xs font-semibold mt-1 ${isOverdue || isToday ? 'text-[#E24B4A]' : isSoon ? 'text-[#BA7517]' : 'text-gray-400'}`}>
                        🔔 {isOverdue ? `${Math.abs(days)}h terlambat` : isToday ? 'Hari ini!' : isSoon ? `${days}h lagi` : fmtDate(r.remind_date)}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteReminder(r.id)} className="text-gray-300 hover:text-[#E24B4A] text-lg ml-2">×</button>
                </div>
              </Card>
            );
          })}

          {done.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-bold text-gray-300 uppercase mb-2">Selesai ({done.length})</div>
              {done.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-2 opacity-50">
                  <div
                    onClick={() => toggleReminder(r.id, r.done)}
                    className="w-5 h-5 rounded-full bg-[#1D9E75] border-2 border-[#1D9E75] flex items-center justify-center cursor-pointer flex-shrink-0"
                  >
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-400 line-through flex-1">{r.title}</span>
                  <button onClick={() => deleteReminder(r.id)} className="text-gray-300 hover:text-[#E24B4A] text-lg">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Tambah Reminder">
        <div className="flex flex-col gap-3">
          <Input label="Judul Reminder" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="cth. Hubungi katering untuk konfirmasi tamu" />
          <Input label="Tanggal Reminder" type="date" value={form.remind_date} onChange={v => setForm(f => ({ ...f, remind_date: v }))} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Catatan (opsional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Detail tambahan..."
              rows={3}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#E5E0D8] rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#D4537E] resize-none"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <Btn onClick={saveReminder} disabled={saving} className="flex-1">{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
