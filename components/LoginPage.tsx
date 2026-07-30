import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Info, ChevronRight, CheckCircle2, User } from 'lucide-react';
import Logo from './Logo';

interface LoginPageProps {
  onLogin: (nipOrEmail: string, password: string) => void;
}

const PRESET_LOGIN_USERS = [
  {
    name: 'Daffa Taufiq',
    email: 'daffataufiq@ojk.go.id',
    role: 'Admin OJK Jabar',
    initials: 'DT',
    univ: 'UNY',
    badgeColor: 'bg-red-500 text-white'
  },
  {
    name: 'Ratukhansa Salsabila',
    email: 'ratukhansa@ojk.go.id',
    role: 'Analis OJK (ITB)',
    initials: 'RS',
    univ: 'ITB',
    badgeColor: 'bg-blue-600 text-white'
  },
  {
    name: 'Naufal Hanif R.',
    email: 'naufalhanif@ojk.go.id',
    role: 'Analis OJK (UNY)',
    initials: 'NH',
    univ: 'UNY',
    badgeColor: 'bg-emerald-600 text-white'
  },
  {
    name: 'Angga Baihaki Y.',
    email: 'anggabaihaki@ojk.go.id',
    role: 'Analis OJK (UNY)',
    initials: 'AB',
    univ: 'UNY',
    badgeColor: 'bg-amber-600 text-white'
  },
  {
    name: 'Bunga Nazwa S.',
    email: 'banganazwa@ojk.go.id',
    role: 'Analis OJK (Telkom)',
    initials: 'BN',
    univ: 'Telkom',
    badgeColor: 'bg-purple-600 text-white'
  }
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [nipOrEmail, setNipOrEmail] = useState('daffataufiq@ojk.go.id');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState('daffataufiq@ojk.go.id');
  const [error, setError] = useState<string | null>(null);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const reason = localStorage.getItem('finsight_logout_reason');
      if (reason === 'inactivity') {
        setInactivityNotice('Sesi Anda telah berakhir secara otomatis karena tidak ada aktivitas selama 15 menit. Silakan masuk kembali.');
        localStorage.removeItem('finsight_logout_reason');
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nipOrEmail.trim()) {
      setError('Harap masukkan NIP atau Email Anda');
      return;
    }
    if (!password) {
      setError('Harap masukkan Password Anda');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(nipOrEmail, password);
      setIsSubmitting(false);
    }, 500);
  };

  const handleSelectUser = (user: typeof PRESET_LOGIN_USERS[0]) => {
    setSelectedUserEmail(user.email);
    setNipOrEmail(user.email);
    setPassword(user.email.includes('daffa') ? 'admin123' : 'user123');
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(user.email, user.email.includes('daffa') ? 'admin123' : 'user123');
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-950 flex items-center justify-between p-4 sm:p-8 lg:p-14 font-sans select-none">

      {/* FULLSCREEN BACKGROUND IMAGE: Foto Kantor OJK Jawa Barat */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{
          backgroundImage: `url('/kantor_ojk.jpeg')`
        }}
      />

      {/* GRADIENT & LIGHTING OVERLAYS */}
      {/* Dark overlay on the left for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/40 z-0 pointer-events-none" />

      {/* Red Ambient Glow behind the Login Card (Right Side) */}
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C61E1E]/30 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute -right-10 top-1/3 w-[350px] h-[350px] bg-red-500/25 rounded-full blur-[90px] pointer-events-none z-0" />

      {/* Dynamic Grid Dot Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)`,
          backgroundSize: '28px 28px'
        }}
      />

      {/* MAIN CONTENT WRAPPER CONTAINER */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 min-h-[calc(100vh-4rem)]">

        {/* LEFT SIDE: HERO HEADLINE & BRANDING */}
        <div className="lg:col-span-7 flex flex-col justify-between py-6 space-y-8">
          
          {/* Top Logo / Brand Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-lg">
              <Logo />
              <div className="h-4 w-[1px] bg-white/30" />
              <span className="text-xs font-black tracking-widest text-white uppercase">JAWA BARAT</span>
            </div>
          </div>

          {/* Main Hero Headline */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-4 max-w-xl my-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight drop-shadow-md">
              Financial <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-200 to-white">
                Visualization
              </span> <br />
              Dashboard
            </h1>
            
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium max-w-md drop-shadow-sm">
              Visualisasi otomatis data keuangan dari file Excel untuk analisis kinerja dan rasio perbankan regional Jawa Barat.
            </p>
          </motion.div>

          {/* Bottom Security Badge */}
          <div>
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3.5 max-w-xs shadow-xl">
              <div className="w-9 h-9 rounded-xl bg-[#C61E1E]/30 border border-[#C61E1E]/50 flex items-center justify-center shrink-0">
                <ShieldCheck size={19} className="text-red-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">Sistem Internal OJK</h4>
                <p className="text-[11px] text-slate-300 font-medium">Akses terbatas untuk pegawai berwenang</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE: FLOATING WHITE LOGIN CARD */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[36px] p-6 sm:p-8 shadow-2xl shadow-red-950/40 border border-white/90 relative overflow-hidden"
          >
            {/* Top Red Gradient Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C61E1E] via-red-500 to-[#C61E1E]" />

            {/* Header: Logo OJK Jabar & Welcome */}
            <div className="text-center space-y-2 pt-2">
              <div className="flex justify-center mb-2">
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 shadow-sm inline-flex items-center gap-2">
                  <Logo />
                </div>
              </div>
              <p className="text-[11px] font-black text-[#C61E1E] uppercase tracking-widest">OTORITAS JASA KEUANGAN JAWA BARAT</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Selamat Datang Kembali!</h2>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Masuk untuk mengakses dashboard visualisasi data keuangan
              </p>
            </div>

            {/* Quick Login Account Picker */}
            <div className="my-4 space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Pilih Akun Pengguna (Quick Login)</span>
                <span className="text-[10px] text-[#C61E1E] font-bold">5 Akun Tersedia</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-[145px] overflow-y-auto pr-1">
                {PRESET_LOGIN_USERS.map((user) => {
                  const isSelected = nipOrEmail.toLowerCase() === user.email.toLowerCase();
                  return (
                    <button
                      key={user.email}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-red-50/90 border-[#C61E1E] shadow-sm' 
                          : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-xl ${user.badgeColor} flex items-center justify-center font-extrabold text-[10px] shrink-0 shadow-sm`}>
                          {user.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 truncate">{user.name}</span>
                            <span className="text-[9px] font-black text-slate-400">({user.univ})</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-[#C61E1E] bg-white px-2 py-0.5 rounded-lg border border-red-100 shadow-2xs">
                          {user.role}
                        </span>
                        <ChevronRight size={13} className="text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inactivity Auto-Logout Notice */}
            {inactivityNotice && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                <span>{inactivityNotice}</span>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NIP / Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>NIP / Email</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={nipOrEmail}
                    onChange={(e) => setNipOrEmail(e.target.value)}
                    placeholder="Masukkan NIP atau Email Anda"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#C61E1E] focus:bg-white text-slate-900 rounded-2xl pl-10 pr-4 py-3 text-xs font-medium focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Password</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#C61E1E] focus:bg-white text-slate-900 rounded-2xl pl-10 pr-11 py-3 text-xs font-medium focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Checkbox & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#C61E1E] focus:ring-red-500 accent-[#C61E1E] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600">Ingat saya</span>
                </label>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert('Silakan hubungi Administrator IT OJK Jawa Barat untuk me-reset password Anda.'); }}
                  className="text-xs font-bold text-[#C61E1E] hover:underline"
                >
                  Lupa password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C61E1E] hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 hover:shadow-red-600/45 transition-all duration-200 cursor-pointer disabled:opacity-75 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Masuk ke Dashboard</span>
                  </>
                )}
              </button>
            </form>

            {/* Toggle About Us Section */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setShowAbout(!showAbout)}
                className="w-full text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 py-1 cursor-pointer transition-colors"
              >
                <Info size={13} className="text-[#C61E1E]" />
                <span>{showAbout ? 'Sembunyikan Info Website' : 'Tentang Website & Tim Pengembang (About Us)'}</span>
              </button>

              {showAbout && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-4 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs space-y-4 text-slate-600 leading-relaxed max-h-[280px] overflow-y-auto"
                >
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C61E1E]"></span>
                      Informasi Aplikasi FINSIGHT
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <strong>FINSIGHT OJK Jawa Barat</strong> adalah sistem visualisasi keuangan internal yang dirancang untuk mempercepat pengolahan data perbankan regional (Aset, DPK, Kredit, NPL, CAR) dari file Excel secara otomatis, presisi, dan terintegrasi.
                    </p>
                  </div>

                  {/* Tim Pengembang Aplikasi */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <h4 className="text-[10.5px] font-black text-slate-800 uppercase tracking-wider text-center text-[#C61E1E]">
                      TIM PENGEMBANG APLIKASI
                    </h4>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {/* UNY */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60 flex flex-col items-center text-center">
                        <img src="/uny_logo.png" alt="UNY" className="w-6 h-6 object-contain mb-1" />
                        <span className="text-[10px] font-black text-slate-800">UNY</span>
                        <div className="w-full border-t border-slate-100 mt-1 pt-1 text-[9px] font-semibold text-slate-600 space-y-0.5">
                          <p>Daffa Taufiqurahman</p>
                          <p>Naufal Hanif R.</p>
                          <p>Angga Baihaki Y.</p>
                        </div>
                      </div>

                      {/* ITB */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60 flex flex-col items-center text-center">
                        <img src="/itb_logo.png" alt="ITB" className="w-6 h-6 object-contain mb-1" />
                        <span className="text-[10px] font-black text-slate-800">ITB</span>
                        <div className="w-full border-t border-slate-100 mt-1 pt-1 text-[9px] font-semibold text-slate-600 space-y-0.5">
                          <p>Ratukhansa Salsabila</p>
                        </div>
                      </div>

                      {/* Telkom Univ */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60 flex flex-col items-center text-center">
                        <img src="/telkom_logo.png" alt="Telkom Univ" className="w-6 h-6 object-contain mb-1" />
                        <span className="text-[10px] font-black text-slate-800">Telkom</span>
                        <div className="w-full border-t border-slate-100 mt-1 pt-1 text-[9px] font-semibold text-slate-600 space-y-0.5">
                          <p>Bunga Nazwa S.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Note */}
            <div className="text-center text-[10.5px] text-slate-400 font-semibold pt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck size={13} className="text-slate-400" />
              <span>Internal Staff Only — Protected by OJK Security</span>
            </div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
