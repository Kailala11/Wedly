import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card, Btn, Input } from '../components/UI';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({ wo_name: '', owner_name: '', phone: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { // eslint-disable-line
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, []); // eslint-disable-line

  async function saveProfile() {
    setSaving(true);
    await supabase.from('profiles').upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500">Kelola profil dan akun Wedly kamu</p>
      </div>

      <Card className="p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Profil Wedding Organizer</h3>
        <div className="flex flex-col gap-3">
          <Input label="Nama WO / Bisnis" value={profile.wo_name || ''} onChange={v => setProfile(p => ({ ...p, wo_name: v }))} placeholder="cth. WO Melati" />
          <Input label="Nama Pemilik" value={profile.owner_name || ''} onChange={v => setProfile(p => ({ ...p, owner_name: v }))} placeholder="Nama lengkap" />
          <Input label="No. HP / WA" value={profile.phone || ''} onChange={v => setProfile(p => ({ ...p, phone: v }))} placeholder="08xx-xxxx-xxxx" />
          <Input label="Kota" value={profile.city || ''} onChange={v => setProfile(p => ({ ...p, city: v }))} placeholder="cth. Jakarta" />
          <Btn onClick={saveProfile} disabled={saving} className="mt-1">
            {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan' : 'Simpan Profil'}
          </Btn>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Akun</h3>
        <p className="text-xs text-gray-400 mb-4">{user?.email}</p>
        <Btn variant="danger" onClick={signOut}>Keluar dari Wedly</Btn>
      </Card>

      <p className="text-center text-xs text-gray-300 mt-8">Wedly v1.0 · © 2026</p>
    </div>
  );
}
