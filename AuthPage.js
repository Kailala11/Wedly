import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Btn, Input } from '../components/UI';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [woName, setWoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setSuccess('Pendaftaran berhasil! Silakan cek email untuk konfirmasi, lalu login.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D4537E]" />
            <span className="text-3xl font-bold text-[#72243E]">Wedly</span>
          </div>
          <p className="text-sm text-gray-500">Platform manajemen Wedding Organizer</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">
            {mode === 'login' ? 'Masuk ke akun Anda' : 'Daftar akun baru'}
          </h2>

          <form onSubmit={handle} className="flex flex-col gap-3">
            {mode === 'register' && (
              <Input label="Nama WO / Bisnis" value={woName} onChange={setWoName} placeholder="cth. WO Melati" />
            )}
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="email@domain.com" required />
            <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="min. 6 karakter" required />

            {error && (
              <div className="bg-[#FCEBEB] text-[#A32D2D] text-xs px-3 py-2 rounded-lg">{error}</div>
            )}
            {success && (
              <div className="bg-[#E1F5EE] text-[#085041] text-xs px-3 py-2 rounded-lg">{success}</div>
            )}

            <Btn type="submit" disabled={loading} className="w-full mt-1" size="lg">
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </Btn>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>Belum punya akun?{' '}
                <button onClick={() => setMode('register')} className="text-[#D4537E] font-semibold">Daftar</button>
              </>
            ) : (
              <>Sudah punya akun?{' '}
                <button onClick={() => setMode('login')} className="text-[#D4537E] font-semibold">Masuk</button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Wedly · 0877953800
        </p>
      </div>
    </div>
  );
}
