import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fmtDate } from '../utils/helpers';
import { Card, Btn, Input, Select, Spinner, Empty, Modal, SectionHeader } from '../components/UI';

const BatikStrip = () => (
  <div style={{height:'4px',background:'repeating-linear-gradient(90deg,#1A6B5A 0,#1A6B5A 10px,#E8B84B 10px,#E8B84B 20px,#259078 20px,#259078 30px,#C8952A 30px,#C8952A 40px)',borderRadius:'4px 4px 0 0'}}/>
);

export default function MeetingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('client');
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionInputs, setActionInputs] = useState({});
  const [showActionInput, setShowActionInput] = useState(null);
  const fileRef = useRef();
  const [uploadingFor, setUploadingFor] = useState(null);

  const [form, setForm] = useState({
    type: 'client',
    title: '',
    event_id: '',
    attendees: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
  });

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  async function fetchAll() {
    setLoading(true);
    const [{ data: m }, { data: ev }] = await Promise.all([
      supabase.from('meetings').select('*, meeting_actions(*), meeting_files(*)')
        .eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('events').select('id, name').eq('user_id', user.id),
    ]);
    setMeetings(m || []);
    setEvents(ev || []);
    setLoading(false);
  }

  // Auto-calculate meeting number per event (client) or overall (team)
  function getMeetingNumber(type, eventId) {
    const filtered = meetings.filter(m =>
      m.type === type && (type === 'client' ? m.event_id === eventId : true)
    );
    return filtered.length + 1;
  }

  async function saveMeeting() {
    if (!form.title.trim()) return;
    setSaving(true);
    const num = getMeetingNumber(form.type, form.event_id);
    await supabase.from('meetings').insert({
      user_id: user.id,
      type: form.type,
      title: form.title.trim(),
      event_id: form.event_id || null,
      meeting_number: num,
      attendees: form.attendees,
      date: form.date,
      summary: form.summary,
    });
    setForm({ type: tab, title: '', event_id: '', attendees: '', date: new Date().toISOString().split('T')[0], summary: '' });
    setShowModal(false);
    setSaving(false);
    fetchAll();
  }

  async function deleteMeeting(id) {
    if (!window.confirm('Hapus catatan rapat ini?')) return;
    // Delete files from storage
    const meeting = meetings.find(m => m.id === id);
    if (meeting?.meeting_files?.length) {
      await Promise.all(meeting.meeting_files.map(f =>
        supabase.storage.from('meeting-files').remove([f.storage_path])
      ));
    }
    await supabase.from('meetings').delete().eq('id', id);
    setMeetings(ms => ms.filter(m => m.id !== id));
  }

  async function saveAction(meetingId) {
    const text = (actionInputs[meetingId] || '').trim();
    if (!text) return;
    await supabase.from('meeting_actions').insert({ meeting_id: meetingId, user_id: user.id, text, done: false });
    setActionInputs(f => ({ ...f, [meetingId]: '' }));
    setShowActionInput(null);
    fetchAll();
  }

  async function toggleAction(id, done) {
    await supabase.from('meeting_actions').update({ done: !done }).eq('id', id);
    setMeetings(ms => ms.map(m => ({
      ...m,
      meeting_actions: (m.meeting_actions || []).map(a => a.id === id ? { ...a, done: !done } : a)
    })));
  }

  async function deleteAction(id) {
    await supabase.from('meeting_actions').delete().eq('id', id);
    setMeetings(ms => ms.map(m => ({
      ...m,
      meeting_actions: (m.meeting_actions || []).filter(a => a.id !== id)
    })));
  }

  async function handleFileUpload(e, meetingId) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingFor(meetingId);
    for (const file of files) {
      const path = `${user.id}/${meetingId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('meeting-files').upload(path, file);
      if (!error) {
        const size = file.size < 1048576 ? (file.size / 1024).toFixed(0) + ' KB' : (file.size / 1048576).toFixed(1) + ' MB';
        const isImage = file.type.startsWith('image/');
        await supabase.from('meeting_files').insert({
          meeting_id: meetingId, user_id: user.id,
          name: file.name, size, storage_path: path,
          file_type: isImage ? 'image' : 'file',
        });
      }
    }
    setUploadingFor(null);
    e.target.value = '';
    fetchAll();
  }

  async function downloadFile(f) {
    const { data } = await supabase.storage.from('meeting-files').createSignedUrl(f.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function deleteFile(f) {
    await supabase.storage.from('meeting-files').remove([f.storage_path]);
    await supabase.from('meeting_files').delete().eq('id', f.id);
    setMeetings(ms => ms.map(m => ({
      ...m,
      meeting_files: (m.meeting_files || []).filter(mf => mf.id !== f.id)
    })));
  }

  const filtered = meetings.filter(m => m.type === tab);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '16px 20px', maxWidth: '760px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '8px', height: '8px', background: '#C8952A', transform: 'rotate(45deg)' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2E28' }}>Catatan Rapat</h1>
        </div>
        <p style={{ fontSize: '13px', color: '#6B8C84' }}>Dokumentasi rapat dengan klien dan tim internal</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#EEE5CC', padding: '4px', borderRadius: '10px' }}>
        {[
          { id: 'client', label: '🤝 Dengan Klien' },
          { id: 'team', label: '👥 Dengan Tim' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? '#1A2E28' : '#6B8C84',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Add button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
        <Btn onClick={() => { setForm(f => ({ ...f, type: tab })); setShowModal(true); }}>
          + Tambah Rapat
        </Btn>
      </div>

      {/* Meeting list */}
      {filtered.length === 0 ? (
        <Empty text={`Belum ada catatan rapat ${tab === 'client' ? 'dengan klien' : 'dengan tim'}.`} icon="📝" />
      ) : filtered.map(m => {
        const isExpanded = expandedId === m.id;
        const actions = m.meeting_actions || [];
        const files = m.meeting_files || [];
        const actionsDone = actions.filter(a => a.done).length;
        const ev = events.find(e => e.id === m.event_id);

        return (
          <div key={m.id} style={{ background: 'white', border: '1px solid #DDD0B3', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <BatikStrip />
            {/* Card header */}
            <div style={{ padding: '14px', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : m.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: tab === 'client' ? '#E0F2EE' : '#EEE5CC', color: tab === 'client' ? '#1A6B5A' : '#6B8C84', padding: '2px 8px', borderRadius: '99px' }}>
                      Rapat ke-{m.meeting_number}
                    </span>
                    {ev && <span style={{ fontSize: '11px', color: '#6B8C84' }}>· {ev.name}</span>}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A2E28', marginTop: '4px' }}>{m.title}</div>
                  <div style={{ fontSize: '12px', color: '#6B8C84', marginTop: '2px' }}>
                    {fmtDate(m.date)}{m.attendees ? ` · ${m.attendees}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                  {actions.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: actionsDone === actions.length ? '#DCF0EB' : '#FBF3DF', color: actionsDone === actions.length ? '#1A6B5A' : '#C8952A' }}>
                      {actionsDone}/{actions.length} action
                    </span>
                  )}
                  {files.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#6B8C84' }}>📎 {files.length}</span>
                  )}
                  <span style={{ color: '#6B8C84', fontSize: '13px' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid #EEE5CC', padding: '14px' }}>
                {/* Summary */}
                {m.summary && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B8C84', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Summary</div>
                    <div style={{ fontSize: '13px', color: '#2D4F45', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#FDFAF2', borderRadius: '8px', padding: '10px 12px', border: '1px solid #EEE5CC' }}>{m.summary}</div>
                  </div>
                )}

                {/* Action Items */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B8C84', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action Items</div>
                    <button onClick={() => setShowActionInput(showActionInput === m.id ? null : m.id)}
                      style={{ fontSize: '12px', color: '#C8952A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                      + Tambah
                    </button>
                  </div>
                  {showActionInput === m.id && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        value={actionInputs[m.id] || ''}
                        onChange={e => setActionInputs(f => ({ ...f, [m.id]: e.target.value }))}
                        placeholder="cth. Konfirmasi katering H-14"
                        onKeyDown={e => e.key === 'Enter' && saveAction(m.id)}
                        style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #DDD0B3', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                      />
                      <Btn size="sm" onClick={() => saveAction(m.id)}>✓</Btn>
                    </div>
                  )}
                  {actions.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#6B8C84', padding: '4px 0' }}>Belum ada action item.</div>
                  ) : actions.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', opacity: a.done ? 0.55 : 1 }}>
                      <div onClick={() => toggleAction(a.id, a.done)}
                        style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${a.done ? '#1A6B5A' : '#DDD0B3'}`, background: a.done ? '#1A6B5A' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: '11px', fontWeight: 700, color: 'white' }}>
                        {a.done ? '✓' : ''}
                      </div>
                      <span style={{ fontSize: '13px', flex: 1, color: '#1A2E28', textDecoration: a.done ? 'line-through' : 'none' }}>{a.text}</span>
                      <button onClick={() => deleteAction(a.id)} style={{ color: '#DDD0B3', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
                    </div>
                  ))}
                </div>

                {/* Files & Foto */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B8C84', textTransform: 'uppercase', letterSpacing: '0.5px' }}>File & Foto</div>
                    <button
                      onClick={() => { setUploadingFor(m.id); fileRef.current?.click(); }}
                      style={{ fontSize: '12px', color: '#C8952A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                      + Upload
                    </button>
                  </div>
                  {uploadingFor === m.id && (
                    <div style={{ fontSize: '12px', color: '#6B8C84', padding: '4px 0' }}>Mengupload...</div>
                  )}
                  {files.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#6B8C84' }}>Belum ada file.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                      {files.map(f => (
                        <div key={f.id} style={{ background: '#FDFAF2', border: '1px solid #EEE5CC', borderRadius: '8px', padding: '8px', position: 'relative' }}>
                          <div style={{ fontSize: '20px', textAlign: 'center', marginBottom: '4px' }}>
                            {f.file_type === 'image' ? '🖼' : '📄'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#1A2E28', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                          <div style={{ fontSize: '10px', color: '#6B8C84' }}>{f.size}</div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            <button onClick={() => downloadFile(f)}
                              style={{ flex: 1, fontSize: '10px', padding: '3px', background: '#1A6B5A', color: '#F5CC5A', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                              ↓ Buka
                            </button>
                            <button onClick={() => deleteFile(f)}
                              style={{ padding: '3px 6px', background: 'transparent', color: '#C0392B', border: '1px solid #DDD0B3', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete meeting */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #EEE5CC' }}>
                  <button onClick={() => deleteMeeting(m.id)}
                    style={{ fontSize: '12px', color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Hapus catatan rapat ini
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Hidden file input */}
      <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xlsx,.pptx"
        style={{ display: 'none' }}
        onChange={e => uploadingFor && handleFileUpload(e, uploadingFor)} />

      {/* Modal tambah rapat */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Tambah Rapat ${form.type === 'client' ? 'dengan Klien' : 'dengan Tim'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Type toggle */}
          <div style={{ display: 'flex', background: '#EEE5CC', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            {[{ id: 'client', label: '🤝 Klien' }, { id: 'team', label: '👥 Tim' }].map(t => (
              <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                style={{ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: form.type === t.id ? 'white' : 'transparent', color: form.type === t.id ? '#1A2E28' : '#6B8C84' }}>
                {t.label}
              </button>
            ))}
          </div>

          <Input label="Judul Rapat" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="cth. Diskusi Vendor Katering" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Tanggal" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <Input label="Peserta" value={form.attendees} onChange={v => setForm(f => ({ ...f, attendees: v }))} placeholder="cth. Ibu Sari, Pak Budi" />
          </div>

          {form.type === 'client' && (
            <Select label="Event terkait" value={form.event_id} onChange={v => setForm(f => ({ ...f, event_id: v }))}
              options={[{ value: '', label: '— Pilih event —' }, ...events.map(e => ({ value: e.id, label: e.name }))]} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#6B8C84' }}>Summary / Hasil Rapat</label>
            <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Tuliskan poin-poin penting hasil rapat..."
              rows={4}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #DDD0B3', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Btn onClick={saveMeeting} disabled={saving} className="flex-1" style={{ flex: 1 }}>
              {saving ? 'Menyimpan...' : 'Simpan Rapat'}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
