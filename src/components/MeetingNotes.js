import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fmtDate } from '../utils/helpers';
import { Card, Btn, Input, Spinner, Empty, Modal, SectionHeader } from './UI';

export default function MeetingNotes({ eventId }) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], title: '', attendees: '', summary: '' });
  const [actionForm, setActionForm] = useState({});
  const [showActionInput, setShowActionInput] = useState(null);

  useEffect(() => { fetchMeetings(); }, [eventId]); // eslint-disable-line

  async function fetchMeetings() {
    setLoading(true);
    const { data } = await supabase
      .from('meeting_notes')
      .select('*, action_items(*)')
      .eq('event_id', eventId)
      .order('date', { ascending: false });
    setMeetings(data || []);
    setLoading(false);
  }

  async function saveMeeting() {
    if (!form.title.trim()) return;
    setSaving(true);
    await supabase.from('meeting_notes').insert({
      event_id: eventId, user_id: user.id,
      date: form.date, title: form.title.trim(),
      attendees: form.attendees, summary: form.summary,
    });
    setForm({ date: new Date().toISOString().split('T')[0], title: '', attendees: '', summary: '' });
    setShowModal(false);
    setSaving(false);
    fetchMeetings();
  }

  async function deleteMeeting(id) {
    if (!window.confirm('Hapus catatan rapat ini?')) return;
    await supabase.from('meeting_notes').delete().eq('id', id);
    setMeetings(m => m.filter(x => x.id !== id));
  }

  async function saveActionItem(meetingId) {
    const text = (actionForm[meetingId] || '').trim();
    if (!text) return;
    await supabase.from('action_items').insert({
      meeting_id: meetingId, user_id: user.id, text, done: false,
    });
    setActionForm(f => ({ ...f, [meetingId]: '' }));
    setShowActionInput(null);
    fetchMeetings();
  }

  async function toggleAction(id, done) {
    await supabase.from('action_items').update({ done: !done }).eq('id', id);
    setMeetings(ms => ms.map(m => ({
      ...m,
      action_items: (m.action_items || []).map(a => a.id === id ? { ...a, done: !done } : a)
    })));
  }

  async function deleteAction(id) {
    await supabase.from('action_items').delete().eq('id', id);
    setMeetings(ms => ms.map(m => ({
      ...m,
      action_items: (m.action_items || []).filter(a => a.id !== id)
    })));
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <SectionHeader
        title={`Catatan Rapat (${meetings.length})`}
        action={<Btn size="sm" onClick={() => setShowModal(true)}>+ Tambah Rapat</Btn>}
      />

      {meetings.length === 0 ? (
        <Empty text="Belum ada catatan rapat." icon="📝" />
      ) : meetings.map(m => {
        const isExpanded = expandedId === m.id;
        const actionsDone = (m.action_items || []).filter(a => a.done).length;
        const actionsTotal = (m.action_items || []).length;
        return (
          <Card key={m.id} className="mb-3 overflow-hidden">
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : m.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900">{m.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {fmtDate(m.date)}{m.attendees ? ` · ${m.attendees}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {actionsTotal > 0 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionsDone === actionsTotal ? 'bg-[#E1F5EE] text-[#085041]' : 'bg-[#FAEEDA] text-[#BA7517]'}`}>
                      {actionsDone}/{actionsTotal} done
                    </span>
                  )}
                  <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-[#E5E0D8] pt-3">
                {m.summary && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Summary</div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{m.summary}</div>
                  </div>
                )}

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-gray-400 uppercase">Action Items</div>
                    <button
                      onClick={() => setShowActionInput(showActionInput === m.id ? null : m.id)}
                      className="text-xs text-[#D4537E] font-semibold"
                    >
                      + Tambah
                    </button>
                  </div>

                  {showActionInput === m.id && (
                    <div className="flex gap-2 mb-2">
                      <input
                        value={actionForm[m.id] || ''}
                        onChange={e => setActionForm(f => ({ ...f, [m.id]: e.target.value }))}
                        placeholder="cth. Konfirmasi katering H-14"
                        className="flex-1 px-3 py-2 border-[1.5px] border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#D4537E]"
                        onKeyDown={e => e.key === 'Enter' && saveActionItem(m.id)}
                      />
                      <Btn size="sm" onClick={() => saveActionItem(m.id)}>✓</Btn>
                    </div>
                  )}

                  {(m.action_items || []).length === 0 ? (
                    <div className="text-xs text-gray-400 py-1">Belum ada action item.</div>
                  ) : (m.action_items || []).map(a => (
                    <div key={a.id} className={`flex items-center gap-2 py-1.5 ${a.done ? 'opacity-55' : ''}`}>
                      <div
                        onClick={() => toggleAction(a.id, a.done)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer text-xs font-bold ${a.done ? 'bg-[#1D9E75] border-[#1D9E75] text-white' : 'border-[#E5E0D8]'}`}
                      >
                        {a.done ? '✓' : ''}
                      </div>
                      <span className={`text-sm flex-1 ${a.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{a.text}</span>
                      <button onClick={() => deleteAction(a.id)} className="text-gray-300 hover:text-[#E24B4A] text-base">×</button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button onClick={() => deleteMeeting(m.id)} className="text-xs text-[#E24B4A] hover:underline">Hapus catatan ini</button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Tambah Catatan Rapat">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tanggal" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <Input label="Judul Rapat" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="cth. Rapat Pertama Klien" />
          </div>
          <Input label="Peserta" value={form.attendees} onChange={v => setForm(f => ({ ...f, attendees: v }))} placeholder="cth. Pemilik WO, Klien, Koordinator" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Summary / Hasil Rapat</label>
            <textarea
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Tuliskan poin-poin penting hasil rapat..."
              rows={4}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#E5E0D8] rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#D4537E] resize-none"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <Btn onClick={saveMeeting} disabled={saving} className="flex-1">{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
