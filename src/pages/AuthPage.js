import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Btn, Input } from '../components/UI';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setSuccess('Pendaftaran berhasil! Cek email untuk konfirmasi, lalu login.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:'linear-gradient(135deg, #0F4A3C 0%, #1A6B5A 60%, #259078 100%)'}}>
      {/* Batik overlay subtle */}
      <div style={{position:'fixed',inset:0,opacity:0.06,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E%3Crect x='4' y='4' width='64' height='64' stroke='%23E8B84B' stroke-width='1' fill='none'/%3E%3Ccircle cx='36' cy='36' r='8' stroke='%23E8B84B' stroke-width='1' fill='none'/%3E%3Ccircle cx='36' cy='36' r='3' fill='%23E8B84B'/%3E%3Ccircle cx='16' cy='16' r='3' stroke='%23E8B84B' stroke-width='1' fill='none'/%3E%3Ccircle cx='56' cy='16' r='3' stroke='%23E8B84B' stroke-width='1' fill='none'/%3E%3Ccircle cx='16' cy='56' r='3' stroke='%23E8B84B' stroke-width='1' fill='none'/%3E%3Ccircle cx='56' cy='56' r='3' stroke='%23E8B84B' stroke-width='1' fill='none'/%3E%3C/svg%3E")`}} />

      <div className="w-full max-w-sm relative">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-content-center justify-center gap-3 mb-2">
            <div style={{flex:1,height:'1px',background:'#E8B84B',opacity:0.5,maxWidth:'40px'}}/>
            <div style={{width:'8px',height:'8px',background:'#F5CC5A',transform:'rotate(45deg)'}}/>
            <span style={{fontSize:'32px',fontWeight:500,color:'#F5CC5A',letterSpacing:'4px'}}>Wedly</span>
            <div style={{width:'8px',height:'8px',background:'#F5CC5A',transform:'rotate(45deg)'}}/>
            <div style={{flex:1,height:'1px',background:'#E8B84B',opacity:0.5,maxWidth:'40px'}}/>
          </div>
          <p style={{fontSize:'11px',color:'rgba(255,255,255,0.45)',letterSpacing:'3px'}}>WEDDING ORGANIZER</p>
        </div>

        {/* Card */}
        <div className="bg-[#FDFAF2] rounded-2xl shadow-xl border border-[#DDD0B3] overflow-hidden">
          <div style={{height:'5px',background:'repeating-linear-gradient(90deg,#1A6B5A 0,#1A6B5A 10px,#E8B84B 10px,#E8B84B 20px,#259078 20px,#259078 30px,#C8952A 30px,#C8952A 40px)'}}/>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div style={{width:'8px',height:'8px',background:'#C8952A',transform:'rotate(45deg)'}}/>
              <h2 className="text-base font-bold text-[#1A2E28]">
                {mode === 'login' ? 'Masuk ke akun Anda' : 'Daftar akun baru'}
              </h2>
            </div>

            <form onSubmit={handle} className="flex flex-col gap-3">
              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="email@domain.com" required/>
              <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="min. 6 karakter" required/>
              {error && <div className="bg-[#FEF0F0] text-[#A32D2D] text-xs px-3 py-2 rounded-lg border border-[#F5B7B1]">{error}</div>}
              {success && <div className="bg-[#DCF0EB] text-[#085041] text-xs px-3 py-2 rounded-lg border border-[#7ECFC3]">{success}</div>}
              <Btn type="submit" disabled={loading} className="w-full mt-1" size="lg">
                {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
              </Btn>
            </form>

            <div className="mt-4 text-center text-sm text-[#6B8C84]">
              {mode === 'login' ? (
                <>Belum punya akun?{' '}<button onClick={() => setMode('register')} className="text-[#C8952A] font-semibold">Daftar</button></>
              ) : (
                <>Sudah punya akun?{' '}<button onClick={() => setMode('login')} className="text-[#C8952A] font-semibold">Masuk</button></>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{color:'rgba(255,255,255,0.3)'}}>
          © 2026 Wedly · Platform Manajemen Wedding Organizer
        </p>
      </div>
    </div>
  );
}
