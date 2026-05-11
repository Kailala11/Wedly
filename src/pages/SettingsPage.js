import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Card, Btn, Input, Spinner } from '../components/UI';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { workspace, members, role, isOwner, removeMember, updateWorkspaceName, joinWorkspace } = useWorkspace();
  const [profile, setProfile] = useState({ wo_name: '', owner_name: '', phone: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [wsName, setWsName] = useState('');
  const [savingWs, setSavingWs] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    if (workspace) setWsName(workspace.name);
  }, [workspace]);

  async function saveProfile() {
    setSaving(true);
    await supabase.from('profiles').upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function saveWsName() {
    setSavingWs(true);
    await updateWorkspaceName(wsName);
    setSavingWs(false);
  }

  function copyCode() {
    navigator.clipboard.writeText(workspace?.invite_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setJoining(true); setJoinError(''); setJoinSuccess('');
    const result = await joinWorkspace(inviteCode);
    if (result.error) setJoinError(result.error);
    else setJoinSuccess(`Berhasil bergabung ke workspace "${result.wsName}"!`);
    setJoining(false);
  }

  const Gem = () => <div style={{width:'8px',height:'8px',background:'#C8952A',transform:'rotate(45deg)',flexShrink:0}}/>;

  const SectionTitle = ({ title }) => (
    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
      <Gem/>
      <h3 style={{fontSize:'14px',fontWeight:700,color:'#1A2E28'}}>{title}</h3>
    </div>
  );

  return (
    <div style={{padding:'16px 20px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{marginBottom:'20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
          <Gem/>
          <h1 style={{fontSize:'20px',fontWeight:700,color:'#1A2E28'}}>Pengaturan</h1>
        </div>
        <p style={{fontSize:'13px',color:'#6B8C84'}}>Kelola profil, tim, dan akun Wedly kamu</p>
      </div>

      {/* Profil */}
      <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <SectionTitle title="Profil Wedding Organizer"/>
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <Input label="Nama WO / Bisnis" value={profile.wo_name||''} onChange={v=>setProfile(p=>({...p,wo_name:v}))} placeholder="cth. WO Melati"/>
          <Input label="Nama Pemilik" value={profile.owner_name||''} onChange={v=>setProfile(p=>({...p,owner_name:v}))} placeholder="Nama lengkap"/>
          <Input label="No. HP / WA" value={profile.phone||''} onChange={v=>setProfile(p=>({...p,phone:v}))} placeholder="08xx-xxxx-xxxx"/>
          <Input label="Kota" value={profile.city||''} onChange={v=>setProfile(p=>({...p,city:v}))} placeholder="cth. Jakarta"/>
          <Btn onClick={saveProfile} disabled={saving}>
            {saving?'Menyimpan...':saved?'✓ Tersimpan':'Simpan Profil'}
          </Btn>
        </div>
      </div>

      {/* Workspace owner */}
      {isOwner && workspace && (
        <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
          <SectionTitle title="Pengaturan Tim"/>

          {/* Nama workspace */}
          <div style={{marginBottom:'14px'}}>
            <label style={{fontSize:'12px',fontWeight:500,color:'#6B8C84',display:'block',marginBottom:'5px'}}>Nama Workspace / WO</label>
            <div style={{display:'flex',gap:'8px'}}>
              <input value={wsName} onChange={e=>setWsName(e.target.value)}
                style={{flex:1,padding:'9px 12px',border:'1.5px solid #DDD0B3',borderRadius:'8px',fontSize:'13px',outline:'none'}}/>
              <Btn size="sm" onClick={saveWsName} disabled={savingWs}>{savingWs?'...':'Simpan'}</Btn>
            </div>
          </div>

          {/* Kode undangan */}
          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:500,color:'#6B8C84',display:'block',marginBottom:'5px'}}>Kode Tim untuk Karyawan</label>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <div style={{flex:1,background:'#FDFAF2',border:'1.5px solid #E8B84B',borderRadius:'8px',padding:'10px 14px',fontFamily:'monospace',fontSize:'18px',fontWeight:700,color:'#1A6B5A',letterSpacing:'3px',textAlign:'center'}}>
                {workspace.invite_code}
              </div>
              <Btn variant="amber" onClick={copyCode}>{copied?'✓ Disalin!':'Salin Kode'}</Btn>
            </div>
            <p style={{fontSize:'11px',color:'#6B8C84',marginTop:'6px'}}>Bagikan kode ini ke karyawan via WhatsApp. Mereka daftar di Wedly lalu masukkan kode ini untuk bergabung.</p>
          </div>

          {/* Daftar member */}
          <div>
            <label style={{fontSize:'12px',fontWeight:500,color:'#6B8C84',display:'block',marginBottom:'8px'}}>Anggota Tim ({members.length})</label>
            {members.map(m => (
              <div key={m.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #EEE5CC'}}>
                <div>
                  <div style={{fontSize:'13px',fontWeight:600,color:'#1A2E28'}}>{m.profiles?.owner_name || 'Pengguna'}</div>
                  <div style={{fontSize:'11px',color:'#6B8C84'}}>{m.role === 'owner' ? '👑 Owner' : '👤 Karyawan'} · Bergabung {new Date(m.joined_at).toLocaleDateString('id-ID')}</div>
                </div>
                {m.role !== 'owner' && (
                  <button onClick={() => {if(window.confirm('Keluarkan anggota ini?')) removeMember(m.user_id)}}
                    style={{fontSize:'12px',color:'#C0392B',background:'none',border:'1px solid #DDD0B3',borderRadius:'6px',padding:'4px 10px',cursor:'pointer'}}>
                    Keluarkan
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join workspace untuk karyawan */}
      {!isOwner && (
        <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
          <SectionTitle title="Bergabung ke Tim"/>
          {workspace ? (
            <div style={{background:'#DCF0EB',border:'1px solid #7ECFC3',borderRadius:'8px',padding:'12px'}}>
              <div style={{fontSize:'13px',fontWeight:600,color:'#1A6B5A'}}>✓ Tergabung di: {workspace.name}</div>
              <div style={{fontSize:'11px',color:'#6B8C84',marginTop:'3px'}}>Kamu adalah anggota tim workspace ini</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <p style={{fontSize:'13px',color:'#6B8C84'}}>Masukkan kode tim dari owner WO untuk bergabung ke workspace mereka.</p>
              <Input label="Kode Tim" value={inviteCode} onChange={setInviteCode} placeholder="cth. AB12CD34"/>
              {joinError && <div style={{background:'#FEF0F0',color:'#C0392B',fontSize:'12px',padding:'8px 12px',borderRadius:'8px',border:'1px solid #F5B7B1'}}>{joinError}</div>}
              {joinSuccess && <div style={{background:'#DCF0EB',color:'#085041',fontSize:'12px',padding:'8px 12px',borderRadius:'8px',border:'1px solid #7ECFC3'}}>{joinSuccess}</div>}
              <Btn onClick={handleJoin} disabled={joining}>{joining?'Bergabung...':'Bergabung ke Tim'}</Btn>
            </div>
          )}
        </div>
      )}

      {/* Akun */}
      <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <SectionTitle title="Akun"/>
        <p style={{fontSize:'12px',color:'#6B8C84',marginBottom:'12px'}}>{user?.email}</p>
        <Btn variant="danger" onClick={signOut}>Keluar dari Wedly</Btn>
      </div>

      <p style={{textAlign:'center',fontSize:'11px',color:'#DDD0B3',marginTop:'20px'}}>Wedly v1.0 · © 2026</p>
    </div>
  );
}
